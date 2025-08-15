(function(){
  const inputEl = document.getElementById('input');
  const resultEl = document.getElementById('result');
  let expression = '';

  // Helper: allowed characters for safety
  const allowedReg = /^[0-9+\-*/().\s]*$/;

  function sanitizeAndEval(expr) {
    if(!expr || !allowedReg.test(expr)){
      return { ok: false, value: 'err' };
    }
    // replace unicode operator glyphs with JS operators
    expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
    // avoid leading zeros or accidental double ops? let JS handle math but prevent dangerous code
    try{
      // Evaluate safely by constructing Function — safe after allowedReg check
      // Limit length to avoid abuse
      if (expr.length > 200) return { ok: false, value: 'too long' };
      const fn = new Function('return (' + expr + ')');
      const val = fn();
      if (typeof val === 'number' && isFinite(val)) {
        return { ok: true, value: +val.toPrecision(12) };
      } else {
        return { ok: false, value: 'NaN' };
      }
    } catch {
      return { ok: false, value: 'err' };
    }
  }

  function updateDisplay() {
    inputEl.textContent = expression || '0';
    const r = sanitizeAndEval(expression);
    resultEl.textContent = r.ok ? r.value : '';
  }

  function append(str) {
    expression += String(str);
    updateDisplay();
  }

  function clearAll() {expression = ''; updateDisplay(); }
  function backspace() {expression = expression.slice(0, -1); updateDisplay(); }
  }

  // Button clicks
  document.querySelectorAll('[data-value]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      append(btn.getAttribute('data-value'));
    });
  });
  document.querySelectorAll('[data-action]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const act = btn.getAttribute('data-action');
      if(act === 'clear') clearAll();
      if(act === 'delete') backspace();
      if(act === 'equals') computeFinal();
    });
  });

  function computeFinal(){
    const r = sanitizeAndEval(expression);
    if(r.ok){
      expression = String(r.value);
      updateDisplay();
    } else {
      // show error briefly
      resultEl.textContent = r.value;
      setTimeout(()=> updateDisplay(), 900);
    }
  }

  // Keyboard support
  window.addEventListener('keydown', ev => {
    if(ev.key === 'Enter' || ev.key === '='){
      ev.preventDefault();
      computeFinal();
      return; 
    }
    if(ev.key === 'Backspace'){ 
      ev.preventDefault();
      backspace(); 
      return; 
    }
    if(ev.key === 'Escape'){ 
      ev.preventDefault(); 
      clearAll(); 
      return; 
    }
    // Accept digits, operators, parentheses, dot, space
    if (/^[0-9+\-*/().]$/.test(ev.key)){ 
      ev.preventDefault(); 
      append(ev.key); 
      return; 
    }
  });

  // Support clicking on the input to position focus for keyboard users
  inputEl.addEventListener('focus', ()=> inputEl.classList.add('focus'));
  inputEl.addEventListener('blur', ()=> inputEl.classList.remove('focus'));

  // initialize
  clearAll();

  // Accessibility: announce updated result (aria-live on screen container)
  // Small enhancement: allow paste (ctrl+v)
  window.addEventListener('paste', ev => {
    const text = (ev.clipboardData || window.clipboardData).getData('text');
    if (text) {
      // only keep allowed chars
      const cleaned = text.split('').filter(ch => /^[0-9+\-*/().\s]$/.test(ch)).join('');
      if (cleaned) append(cleaned);
    }
  });

  // Touch enhancement: long-press equals to get squared (example of bonus feature)
  let holdTimer = null;
  const eqBtn = document.querySelector('[data-action="equals"]');
  eqBtn.addEventListener('pointerdown', () => {
    holdTimer = setTimeout(() => {
      // square current value
      const r = sanitizeAndEval(expression);
      if (r.ok){ expression = String((+r.value) * (+r.value)); updateDisplay(); }
    }, 600);
  });
  eqBtn.addEventListener('pointerup', () => clearTimeout(holdTimer));
  eqBtn.addEventListener('pointerleave', () => clearTimeout(holdTimer));

})();
