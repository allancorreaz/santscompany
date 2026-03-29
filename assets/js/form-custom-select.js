function initCustomSelects(root = document) {
  root.querySelectorAll('.custom-select-wrapper').forEach(function (wrapper) {
    if (wrapper.dataset.initialized) return;
    wrapper.dataset.initialized = "true";

    const nativeSelect = wrapper.querySelector('select');
    if (!nativeSelect) return;

    // 🔥 força multi-select real
    nativeSelect.multiple = true;

    // Remove versões antigas
    wrapper.querySelectorAll('.custom-select, .custom-options').forEach(e => e.remove());

    // Criar botão
    const customSelect = document.createElement('div');
    customSelect.className = 'custom-select';
    customSelect.tabIndex = 0;

    customSelect.innerHTML = `
      <div class="selected placeholder">Selecione o seu serviço</div>
      <span class="arrow">&#9662;</span>
    `;

    wrapper.appendChild(customSelect);

    // Lista
    const optionsList = document.createElement('div');
    optionsList.className = 'custom-options';
    wrapper.appendChild(optionsList);

    Array.from(nativeSelect.options).forEach(function (opt) {
      if (opt.disabled && opt.value === "") return;

      const div = document.createElement('div');
      div.className = 'option';
      div.textContent = opt.textContent;
      div.dataset.value = opt.value;

      if (opt.selected) div.classList.add('selected');

      optionsList.appendChild(div);
    });

    function updateDisplay() {
      const selected = Array.from(nativeSelect.selectedOptions).filter(o => o.value);
      const display = customSelect.querySelector('.selected');

      display.innerHTML = '';

      if (!selected.length) {
        display.textContent = 'Selecione o seu serviço';
        display.classList.add('placeholder');
      } else {
        display.classList.remove('placeholder');

        selected.forEach(opt => {
          const tag = document.createElement('span');
          tag.className = 'tag';
          tag.textContent = opt.textContent;

          const removeBtn = document.createElement('span');
          removeBtn.className = 'remove-tag';
          removeBtn.innerHTML = '&times;';
          removeBtn.dataset.value = opt.value;

          removeBtn.addEventListener('click', function (e) {
            e.stopPropagation();

            opt.selected = false;

            const optionDiv = optionsList.querySelector(`[data-value="${opt.value}"]`);
            if (optionDiv) optionDiv.classList.remove('selected');

            updateDisplay();
          });

          tag.appendChild(removeBtn);
          display.appendChild(tag);
        });
      }

      const form = wrapper.closest('form');
      if (form) {
        const otherContainer = form.querySelector('#otherServiceContainer');
        if (otherContainer) {
          otherContainer.style.display =
            selected.some(o => o.value === 'Outro') ? 'block' : 'none';
        }
      }
    }

    function toggleDropdown() {
      customSelect.classList.toggle('open');
    }

    function closeDropdown() {
      customSelect.classList.remove('open');
    }

    customSelect.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleDropdown();
    });

    document.addEventListener('click', function (e) {
      if (!wrapper.contains(e.target)) closeDropdown();
    });

    optionsList.addEventListener('click', function (e) {
      if (!e.target.classList.contains('option')) return;

      const value = e.target.dataset.value;
      const option = Array.from(nativeSelect.options).find(o => o.value === value);
      if (!option) return;

      option.selected = !option.selected;
      e.target.classList.toggle('selected');

      updateDisplay();
    });

    nativeSelect.addEventListener('change', updateDisplay);

    updateDisplay();
  });
}

/* AUTO-DETECÇÃO */
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType === 1) {
        if (node.matches?.('.custom-select-wrapper') || node.querySelector?.('.custom-select-wrapper')) {
          initCustomSelects(node);
        }
      }
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

/* INIT */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => initCustomSelects());
} else {
  initCustomSelects();
}