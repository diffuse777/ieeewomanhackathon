import { useEffect, useRef, useState } from 'react';

const LOCK_MESSAGE = 'Developers have disabled the developer tools for security purposes.';
const SIZE_THRESHOLD = 160;

function isShortcut(event) {
  const key = event.key;
  const combo = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;

  if (key === 'F12') {
    return true;
  }

  if (combo && shift && ['I', 'J', 'C', 'K'].includes(key.toUpperCase())) {
    return true;
  }

  if (combo && key.toUpperCase() === 'U') {
    return true;
  }

  return false;
}

function isDockedDevTools() {
  const widthGap = Math.abs(window.outerWidth - window.innerWidth);
  const heightGap = Math.abs(window.outerHeight - window.innerHeight);
  return widthGap > SIZE_THRESHOLD || heightGap > SIZE_THRESHOLD;
}

export function DevToolsGuard() {
  const [locked, setLocked] = useState(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    const showLock = () => {
      dismissedRef.current = false;
      setLocked(true);
    };

    const blockShortcut = (event) => {
      if (!isShortcut(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      showLock();
    };

    const blockMenu = (event) => {
      event.preventDefault();
      showLock();
    };

    const watch = () => {
      if (!dismissedRef.current && isDockedDevTools()) {
        setLocked(true);
      }
    };

    window.addEventListener('keydown', blockShortcut, true);
    window.addEventListener('contextmenu', blockMenu, true);
    window.addEventListener('resize', watch);
    const timer = window.setInterval(watch, 800);
    watch();

    return () => {
      window.removeEventListener('keydown', blockShortcut, true);
      window.removeEventListener('contextmenu', blockMenu, true);
      window.removeEventListener('resize', watch);
      window.clearInterval(timer);
    };
  }, []);

  function handleOk() {
    dismissedRef.current = true;
    setLocked(false);
  }

  if (!locked) {
    return null;
  }

  return (
    <div className="devtools-lock" role="alertdialog" aria-modal="true" aria-labelledby="devtools-lock-title">
      <div className="devtools-lock__card">
        <p className="eyebrow">Security</p>
        <h2 id="devtools-lock-title">Developer tools are disabled</h2>
        <p className="lede">{LOCK_MESSAGE}</p>
        <button type="button" className="btn" onClick={handleOk}>
          OK
        </button>
      </div>
    </div>
  );
}
