// src/lib/animations.ts
export const createSpinnerSVG = (isLoading: boolean, size: number = 16) => {
  return isLoading 
    ? `<svg class="animate-spin" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="12" y1="2" x2="12" y2="6"/>
        <line x1="12" y1="18" x2="12" y2="22"/>
        <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
        <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
        <line x1="2" y1="12" x2="6" y2="12"/>
        <line x1="18" y1="12" x2="22" y2="12"/>
        <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
        <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
      </svg>`
    : `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <line x1="22" y1="2" x2="11" y2="13"/>
        <polygon points="22,2 15,22 11,13 2,9 22,2"/>
      </svg>`;
};

export const updateButtonState = (
  button: HTMLButtonElement, 
  isLoading: boolean, 
  loadingText: string = 'Loading...',
  defaultText: string = 'Submit'
) => {
  const btnContent = button.querySelector('.btn-content');
  const btnText = button.querySelector('.btn-text');
  
  if (btnContent && btnText) {
    btnContent.innerHTML = isLoading 
      ? `${createSpinnerSVG(true)} <span class="btn-text">${loadingText}</span>`
      : `${createSpinnerSVG(false)} <span class="btn-text">${defaultText}</span>`;
  }
  
  button.disabled = isLoading;
};

export const createLoadingState = (message: string = 'Loading...') => {
  return `
    <div class="loading-state">
      <div class="loading-spinner">${createSpinnerSVG(true, 20)}</div>
      <p>${message}</p>
    </div>
  `;
};

export const showToast = (
  message: string, 
  type: 'success' | 'error' | 'warning' = 'success'
) => {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'check-circle' : 
               type === 'error' ? 'exclamation-triangle' : 'info-circle';
  
  toast.innerHTML = `
    <i class="fas fa-${icon}"></i>
    <span>${message}</span>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

export const initializeAnimations = () => {
  if (!document.getElementById("tinkbyte-animations")) {
    const style = document.createElement("style");
    style.id = "tinkbyte-animations";
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
      .animate-spin { animation: spin 1s linear infinite; }
      .animate-fade-in { animation: fadeIn 0.3s ease-out; }
      .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
      .animate-slide-out-right { animation: slideOutRight 0.3s ease-out; }
      
      .toast-container {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      
      .toast {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem 1rem;
        color: white;
        font-size: 0.875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.025em;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        font-family: "Space Grotesk", sans-serif;
        max-width: 300px;
      }
      
      .toast.show { transform: translateX(0); }
      .toast-success { background: #10b981; border: 2px solid #10b981; }
      .toast-error { background: #ef4444; border: 2px solid #ef4444; }
      .toast-warning { background: #f59e0b; border: 2px solid #f59e0b; }
      
      .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        color: #64748b;
        font-size: 0.875rem;
      }
      
      html.dark .loading-state {
        color: #94a3b8;
      }
    `;
    document.head.appendChild(style);
  }
};