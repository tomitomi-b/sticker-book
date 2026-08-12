/* 貼られたシール：ボンボンドロップ風のぷっくり＆ツヤ質感 */
.placed-sticker {
  position: absolute;
  display: inline-block;
  font-size: var(--sticker-size, 3.2rem);
  line-height: 1;
  cursor: move;
  user-select: none;
  -webkit-user-drag: none;
  user-drag: none;
  touch-action: none;
  /* 上部ハイライト・厚手の白フチ・樹脂層の縁影・グラデーション浮き上がり影のレイヤー */
  filter:
    /* 1. シール上部のハイライト光線 */
    drop-shadow(0 -2px 1px rgba(255, 255, 255, 0.95))
    /* 2. 厚みのあるぷっくり白フチ（3px） */
    drop-shadow(3px 0 0 #ffffff)
    drop-shadow(-3px 0 0 #ffffff)
    drop-shadow(0 3px 0 #ffffff)
    drop-shadow(0 -3px 0 #ffffff)
    drop-shadow(2.5px 2.5px 0 #ffffff)
    drop-shadow(-2.5px 2.5px 0 #ffffff)
    drop-shadow(2.5px -2.5px 0 #ffffff)
    drop-shadow(-2.5px -2.5px 0 #ffffff)
    /* 3. 樹脂（ドロップ）底面の立体縁影 */
    drop-shadow(0 3px 2px rgba(0, 0, 0, 0.18))
    /* 4. 接地感を生む深い立体落とし影 */
    drop-shadow(0 6px 8px rgba(0, 0, 0, 0.28));
  transition: transform 0.12s ease;
}

.placed-sticker:active {
  transform: scale(1.18) !important;
  filter:
    drop-shadow(0 -2px 1px rgba(255, 255, 255, 1))
    drop-shadow(3px 0 0 #ffffff)
    drop-shadow(-3px 0 0 #ffffff)
    drop-shadow(0 3px 0 #ffffff)
    drop-shadow(0 -3px 0 #ffffff)
    drop-shadow(2.5px 2.5px 0 #ffffff)
    drop-shadow(-2.5px 2.5px 0 #ffffff)
    drop-shadow(2.5px -2.5px 0 #ffffff)
    drop-shadow(-2.5px -2.5px 0 #ffffff)
    drop-shadow(0 12px 14px rgba(0, 0, 0, 0.32));
}