/* Optional browser speech controls. Sending a transcript is always a separate action. */
(() => {
  'use strict';

  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const supportsInput = typeof Recognition === 'function' && window.isSecureContext;
  const supportsPlayback = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  let capture = null;
  let playback = null;
  let voicePanel = null;

  function updatePanel(phase, words, explanation) {
    if (!voicePanel) return;
    const {dialog, field, title, transcript, note, listen, send} = voicePanel;
    dialog.dataset.phase = phase;
    title.textContent = words;
    transcript.textContent = field.value.trim();
    transcript.hidden = !transcript.textContent;
    note.textContent = explanation || '';
    send.disabled = !field.value.trim();
    const listening = phase === 'waiting' || phase === 'listening' || phase === 'speaking';
    listen.textContent = listening ? '聞き取りを止める' : 'もう一度話す';
  }

  function openPanel(button, form, field) {
    if (voicePanel?.dialog.open) return;
    const dialog = document.createElement('dialog');
    dialog.className = 'voice-sheet';
    dialog.setAttribute('aria-labelledby', 'voice-sheet-title');
    dialog.innerHTML = `<div class="voice-panel">
      <header><span>音声で相談</span><button type="button" data-dismiss aria-label="音声入力を閉じる">×</button></header>
      <div class="voice-orbit" aria-hidden="true"><div class="voice-orb"><i></i><i></i><i></i><i></i><i></i></div></div>
      <h2 id="voice-sheet-title" aria-live="polite">マイクを準備しています</h2>
      <p class="voice-caption" hidden></p><p class="voice-note" aria-live="polite"></p>
      <div class="voice-sheet-actions"><button type="button" data-listen-again></button><button type="button" data-accept-voice disabled>この内容で送る</button></div>
      <div class="voice-preferences"><label><input type="checkbox"> 返答を音声でも聞く</label><button type="button" data-type>文字で入力</button></div>
    </div>`;
    document.body.appendChild(dialog);
    const find = selector => dialog.querySelector(selector);
    voicePanel = {dialog, form, field, title:find('h2'), transcript:find('.voice-caption'),
      note:find('.voice-note'), listen:find('[data-listen-again]'), send:find('[data-accept-voice]')};
    function leave(typing) {
      stopCapture();
      dialog.close();
      if (typing) field.focus();
    }
    find('[data-dismiss]').addEventListener('click', () => leave(false));
    find('[data-type]').addEventListener('click', () => leave(true));
    find('[data-listen-again]').addEventListener('click', () => record(button));
    find('[data-accept-voice]').addEventListener('click', () => {
      if (!field.value.trim()) return;
      const readAloud = find('input[type=checkbox]').checked;
      leave(false);
      form.requestSubmit();
      if (readAloud && supportsPlayback) {
        const replyButton = document.querySelector('[data-speak]');
        if (replyButton) readReply(replyButton);
      }
    });
    dialog.addEventListener('close', () => {
      if (voicePanel?.dialog === dialog) { stopCapture(); voicePanel = null; }
      dialog.remove();
    }, {once:true});
    if (!supportsPlayback) find('label').hidden = true;
    dialog.showModal();
  }

  function status(form, message) {
    const element = form?.querySelector('[data-voice-status]') ||
      form?.parentElement?.querySelector('[data-voice-status]');
    if (element && element.textContent !== message) element.textContent = message;
  }

  function describe(button, active, label) {
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', label);
    button.title = label;
  }

  function stopCapture() {
    if (!capture) return;
    const active = capture;
    capture = null;
    describe(active.button, false, '音声で入力');
    status(active.button.closest('form'), '音声入力を終了しました。');
    try { active.engine.abort(); } catch { /* Recognition may already have ended. */ }
  }

  function stopPlayback() {
    if (!playback) return;
    describe(playback.button, false, '返答を読み上げる');
    playback = null;
    window.speechSynthesis.cancel();
  }

  function record(button) {
    if (!supportsInput) return;
    const form = button.closest('form');
    const field = form?.querySelector('input[type=text], input[type=search], textarea');
    if (!field) return;

    if (capture?.button === button) {
      try { capture.engine.stop(); } catch { stopCapture(); }
      return;
    }
    stopPlayback();
    stopCapture();
    openPanel(button, form, field);
    updatePanel('waiting', 'マイクを準備しています', 'ブラウザでマイクの使用を許可してください。');

    let engine;
    try { engine = new Recognition(); } catch {
      status(form, '音声入力を起動できませんでした。文字で入力できます。');
      updatePanel('stopped', 'マイクを使用できません', '文字で入力して相談を続けられます。');
      return;
    }
    const before = field.value;
    const limit = field.maxLength > 0 ? field.maxLength : 1000;
    let gotWords = false;
    let failed = false;
    engine.lang = 'ja-JP';
    engine.interimResults = true;
    engine.continuous = false;
    capture = {engine, field, button};
    describe(button, true, '音声入力を止める');
    status(form, 'マイクを準備しています。');

    engine.onstart = () => {
      if (capture?.engine === engine) {
        status(form, '聞いています。話し終わったら内容を確認できます。');
        updatePanel('listening', 'お話しください', '旅の希望を、そのままどうぞ。');
      }
    };
    engine.onspeechstart = () => {
      if (capture?.engine === engine) updatePanel('speaking', '聞いています', '');
    };
    engine.onresult = (event) => {
      if (capture?.engine !== engine || !field.isConnected) return;
      let words = '';
      for (let i = 0; i < event.results.length; i++) words += event.results[i][0].transcript;
      if (!words.trim()) return;
      gotWords = true;
      field.value = (before + (before ? ' ' : '') + words.trim()).slice(0, limit);
      field.dispatchEvent(new Event('input', {bubbles:true}));
      updatePanel('speaking', '聞いています', '');
      if (event.results[event.results.length - 1].isFinal) {
        status(form, '入力内容を確認して送信してください。');
      }
    };
    engine.onerror = (event) => {
      if (capture?.engine !== engine) return;
      failed = true;
      const reasons = {
        'not-allowed':'マイクの使用が許可されていません。文字で入力できます。',
        'service-not-allowed':'このブラウザでは音声入力を利用できません。文字で入力できます。',
        'audio-capture':'使用できるマイクが見つかりません。文字で入力できます。',
        'no-speech':'声を聞き取れませんでした。もう一度試すか、文字で入力してください。',
        'network':'音声認識サービスにつながりませんでした。文字で入力できます。'
      };
      const message = reasons[event.error] || '音声入力を終了しました。文字で続けられます。';
      status(form, message);
      updatePanel('stopped', '聞き取りを終了しました', message);
    };
    engine.onend = () => {
      if (capture?.engine !== engine) return;
      capture = null;
      describe(button, false, '音声で入力');
      if (!failed) {
        const message = gotWords ? '入力内容を確認して送信してください。' : 'もう一度試すか、文字で入力してください。';
        status(form, message);
        updatePanel('ready', gotWords ? 'この内容で相談しますか？' : '声を聞き取れませんでした', gotWords ? '' : message);
      }
    };
    try { engine.start(); } catch {
      capture = null;
      describe(button, false, '音声で入力');
      status(form, '音声入力を開始できませんでした。文字で入力できます。');
      updatePanel('stopped', 'マイクを使用できません', '文字で入力して相談を続けられます。');
    }
  }

  function readReply(button) {
    if (!supportsPlayback) return;
    const stopOnly = playback?.button === button;
    stopPlayback();
    if (stopOnly) return;
    const source = Array.from(document.querySelectorAll('[data-voice-reply]')).reverse().find(el => el.getClientRects().length);
    const words = source?.innerText?.trim();
    if (!words) return;
    stopCapture();
    const utterance = new SpeechSynthesisUtterance(words);
    utterance.lang = 'ja-JP';
    playback = {button, source, words, utterance};
    describe(button, true, '読み上げを止める');
    const settled = () => {
      if (playback?.utterance !== utterance) return;
      playback = null;
      describe(button, false, '返答を読み上げる');
    };
    utterance.onend = settled;
    utterance.onerror = settled;
    window.speechSynthesis.speak(utterance);
  }

  function synchronize() {
    if (capture && !capture.field.isConnected) stopCapture();
    if (voicePanel && !voicePanel.field.isConnected && voicePanel.dialog.open) voicePanel.dialog.close();
    if (playback && (!playback.source.isConnected || playback.source.innerText.trim() !== playback.words)) stopPlayback();
    for (const button of document.querySelectorAll('[data-voice]')) {
      button.hidden = !supportsInput;
      if (supportsInput && !button.hasAttribute('aria-pressed')) describe(button, false, '音声で入力');
    }
    for (const button of document.querySelectorAll('[data-speak]')) {
      button.hidden = !supportsPlayback;
      if (supportsPlayback && !button.hasAttribute('aria-pressed')) describe(button, false, '返答を読み上げる');
    }
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-voice], [data-speak]');
    if (!button || button.hidden) return;
    if (button.hasAttribute('data-voice')) record(button);
    else readReply(button);
  });
  document.addEventListener('submit', () => { stopCapture(); stopPlayback(); }, true);
  function leaveVoiceControls() {
    stopCapture();
    stopPlayback();
    if (voicePanel?.dialog.open) voicePanel.dialog.close();
  }
  document.addEventListener('click', event => {
    if (event.target.closest?.('[data-route], [data-say], [data-count]')) leaveVoiceControls();
  }, true);
  window.addEventListener('popstate', leaveVoiceControls);
  document.addEventListener('beforeinput', event => {
    if (capture && event.target === capture.field) stopCapture();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { stopCapture(); stopPlayback(); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stopCapture(); stopPlayback(); if (voicePanel?.dialog.open) voicePanel.dialog.close(); }
  });
  window.addEventListener('pagehide', () => { stopCapture(); stopPlayback(); });
  new MutationObserver(synchronize).observe(document.body, {childList:true, subtree:true});
  synchronize();
})();
