import React, { useState } from 'react';

export default function App() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={styles.body}>
      {/* 背景の星くず */}
      <div style={styles.sparkleBg}></div>

      {/* 3D空間コンテナ */}
      <div style={styles.bookViewport}>
        
        {/* 本の土台（開いたときに見える中身） */}
        <div style={styles.bookBase}>
          <div style={styles.innerPage}>
            <div style={styles.innerText}>Sticker Collection Inside</div>
          </div>

          {/* 表紙部分（クリックでパタンと開く） */}
          <div 
            style={{
              ...styles.binderCover,
              ...(isOpen ? styles.binderCoverOpen : {})
            }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {/* 6穴リング */}
            <div style={styles.ringHoles}>
              {[...Array(6)].map((_, i) => (
                <div key={i} style={styles.hole}></div>
              ))}
            </div>

            {/* ヘッダー */}
            <div style={styles.headerZone}>
              <h1 style={styles.titleMain}>Sticker Book</h1>
              <div style={styles.titleSub}>COLLECTION ALBUM</div>
              <div style={styles.dividerLine}></div>
            </div>

            {/* 紫の正三角形 */}
            <div style={styles.triangleWrapper}>
              <div style={styles.simpleTriangle}></div>
            </div>

            {/* インコイラスト */}
            <div style={styles.parrotWrapper}>
              <svg viewBox="0 0 200 200" style={styles.parrotSvg}>
                <defs>
                  <linearGradient id="bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#e0aaff" />
                    <stop offset="50%" stopColor="#c77dff" />
                    <stop offset="100%" stopColor="#7b2cbf" />
                  </linearGradient>
                  <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9d4edd" />
                    <stop offset="100%" stopColor="#3c096c" />
                  </linearGradient>
                  <linearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe600" />
                    <stop offset="100%" stopColor="#ff9900" />
                  </linearGradient>
                </defs>

                <path d="M20 160 C70 155 130 165 180 160" stroke="#5c3d2e" strokeWidth="10" strokeLinecap="round"/>
                <path d="M20 160 C70 155 130 165 180 160" stroke="#7a5230" strokeWidth="4" strokeLinecap="round"/>

                <path d="M85 140 Q 75 185 70 195 Q 85 185 92 145 Z" fill="#5a189a" />
                <path d="M92 140 Q 90 190 90 200 Q 100 185 102 142 Z" fill="#7b2cbf" />

                <path d="M80 60 C 60 80 65 130 85 150 C 110 150 125 120 120 80 C 118 60 100 50 80 60 Z" fill="url(#bodyGrad)" />

                <path d="M88 45 C 80 20 60 15 55 20 C 70 30 78 40 82 48 Z" fill="#ffc6ff" />
                <path d="M95 42 C 95 15 80 5 72 10 C 85 22 88 35 91 44 Z" fill="#e0aaff" />
                <path d="M102 45 C 110 25 100 10 92 12 C 100 25 98 38 98 46 Z" fill="#c77dff" />

                <circle cx="95" cy="62" r="24" fill="url(#bodyGrad)" />
                <path d="M90 52 C 105 50 112 60 108 70 C 98 75 88 68 90 52 Z" fill="#ffffff" opacity="0.9" />
                <circle cx="98" cy="60" r="5" fill="#1a1a1a" />
                <circle cx="100" cy="58" r="1.8" fill="#ffffff" />

                <path d="M105 58 C 128 58 138 75 125 92 C 118 80 110 75 104 74 Z" fill="url(#beakGrad)" />
                <path d="M104 75 C 115 76 120 84 114 90 C 108 85 104 80 102 76 Z" fill="#d47a00" />

                <path d="M75 80 C 60 95 65 130 95 135 C 105 120 110 95 85 80 Z" fill="url(#wingGrad)" />
                <path d="M78 90 C 68 102 72 125 92 128 C 98 118 102 100 85 90 Z" fill="#5a189a" opacity="0.6" />

                <path d="M88 148 L84 158 M92 149 L92 159 M96 148 L100 157" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>

            {/* フッター */}
            <div style={styles.footerZone}>
              <div style={styles.footerBadge}>
                {isOpen ? 'CLICK TO CLOSE' : 'CLICK TO OPEN'}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  body: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: 0,
    background: 'radial-gradient(circle at center, #3b1566 0%, #11052c 100%)',
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    overflow: 'hidden',
    position: 'relative'
  },
  sparkleBg: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundImage: `
      radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
      radial-gradient(2px 2px at 40px 70px, #e0aaff, rgba(0,0,0,0)),
      radial-gradient(3px 3px at 80px 120px, #ffd700, rgba(0,0,0,0))
    `,
    backgroundRepeat: 'repeat',
    backgroundSize: '300px 300px',
    opacity: 0.5,
    pointerEvents: 'none'
  },
  bookViewport: {
    perspective: '1600px'
  },
  bookBase: {
    position: 'relative',
    width: '420px',
    height: '620px',
    background: '#1e0836',
    borderRadius: '24px',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)'
  },
  innerPage: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    width: '380px',
    height: '590px',
    background: '#fdfbfb',
    borderRadius: '8px 16px 16px 8px',
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: 'inset 5px 0 10px rgba(0, 0, 0, 0.1)'
  },
  innerText: {
    color: '#7e2682',
    fontWeight: 'bold',
    letterSpacing: '2px',
    fontSize: '18px'
  },
  binderCover: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(135deg, #4d126b 0%, #7e2682 40%, #240046 100%)',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '45px 30px 35px 50px',
    boxSizing: 'border-box',
    transformOrigin: 'left center',
    transition: 'transform 1.2s cubic-bezier(0.25, 1, 0.5, 1), box-shadow 1.2s ease',
    cursor: 'pointer',
    zIndex: 10
  },
  binderCoverOpen: {
    transform: 'rotateY(-130deg)',
    boxShadow: '-20px 20px 50px rgba(0, 0, 0, 0.5)'
  },
  ringHoles: {
    position: 'absolute',
    left: '15px',
    top: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-evenly',
    padding: '30px 0',
    boxSizing: 'border-box'
  },
  hole: {
    width: '16px',
    height: '16px',
    background: '#11052c',
    borderRadius: '50%',
    boxShadow: 'inset 2px 2px 4px rgba(0, 0, 0, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.15)'
  },
  headerZone: {
    textAlign: 'center',
    zIndex: 2
  },
  titleMain: {
    fontSize: '22px',
    fontWeight: '800',
    letterSpacing: '4px',
    color: '#ffffff',
    textTransform: 'uppercase',
    textShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
    margin: 0
  },
  titleSub: {
    fontSize: '11px',
    letterSpacing: '3px',
    color: '#c77dff',
    marginTop: '6px',
    fontWeight: '600'
  },
  dividerLine: {
    width: '140px',
    height: '2px',
    background: 'linear-gradient(90deg, transparent, #e0aaff, transparent)',
    margin: '10px auto 0'
  },
  triangleWrapper: {
    position: 'relative',
    margin: '10px 0',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  simpleTriangle: {
    width: 0,
    height: 0,
    borderLeft: '65px solid transparent',
    borderRight: '65px solid transparent',
    borderBottom: '112px solid #7e2682',
    filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 10px rgba(199, 125, 255, 0.3))'
  },
  parrotWrapper: {
    position: 'relative',
    width: '160px',
    height: '160px',
    zIndex: 2
  },
  parrotSvg: {
    width: '100%',
    height: '100%',
    filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
  },
  footerZone: {
    textAlign: 'center',
    zIndex: 2
  },
  footerBadge: {
    display: 'inline-block',
    padding: '6px 18px',
    background: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '20px',
    fontSize: '11px',
    letterSpacing: '2px',
    color: '#f0e6ff'
  }
};
