<template>
  <div class="home">
    <client-only>
      <particle :amountX="60" :amountY="60" class="particle-bg" />
    </client-only>
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="title-text">童话的博客</span>
        <span class="title-sub">技术分享 · 实战演示 · 面试题解</span>
      </h1>

      <div class="nav-cards">
        <nuxt-link to="articles" class="nav-card articles-card">
          <div class="card-icon">📝</div>
          <div class="card-content">
            <span class="card-title">技术文章</span>
            <span class="card-desc">探索前沿技术，分享实战经验</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
        <nuxt-link to="demos" class="nav-card demos-card">
          <div class="card-icon">🎮</div>
          <div class="card-content">
            <span class="card-title">在线演示</span>
            <span class="card-desc">交互式Demo，展示技术能力</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
        <nuxt-link to="questions" class="nav-card questions-card">
          <div class="card-icon">💡</div>
          <div class="card-content">
            <span class="card-title">面试题库</span>
            <span class="card-desc">高频面试题，助你offer拿到手软</span>
          </div>
          <div class="card-arrow">→</div>
        </nuxt-link>
        <a href="https://chat.tongxingkuan.xin" target="_blank" rel="noopener noreferrer" class="nav-card chat-card">
          <div class="card-icon">🤖</div>
          <div class="card-content">
            <span class="card-title">AI 智能助手</span>
            <span class="card-desc">在线对话，随时为你答疑</span>
          </div>
          <div class="card-arrow">→</div>
        </a>
      </div>
    </div>
  </div>
</template>
<style lang="less" scoped>
.home {
  width: 100vw;
  min-height: 100vh;
  overflow: auto;
  position: relative;
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.particle-bg {
  position: fixed !important;
  top: 0;
  left: 0;
  width: 100% !important;
  height: 100% !important;
  z-index: 0;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  padding: 60px 20px 40px;
}

.hero-title {
  text-align: center;
  margin-bottom: 50px;

  .title-text {
    display: block;
    font-size: 56px;
    font-weight: 700;
    color: #fff;
    letter-spacing: 4px;
    text-shadow: 0 4px 20px rgba(23, 133, 207, 0.5);
    margin-bottom: 16px;
  }

  .title-sub {
    display: block;
    font-size: 18px;
    color: rgba(255, 255, 255, 0.7);
    letter-spacing: 8px;
  }
}

.nav-cards {
  display: flex;
  gap: 24px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 50px;
}

.nav-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 32px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 16px;
  color: #fff;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 240px;

  &:hover {
    transform: translateY(-4px);
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(23, 133, 207, 0.5);
    box-shadow: 0 8px 32px rgba(23, 133, 207, 0.3);

    .card-arrow {
      transform: translateX(4px);
    }
  }

  .card-icon {
    font-size: 36px;
    line-height: 1;
  }

  .card-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .card-title {
    font-size: 18px;
    font-weight: 600;
  }

  .card-desc {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  .card-arrow {
    font-size: 20px;
    color: rgba(255, 255, 255, 0.5);
    transition: transform 0.3s ease;
  }
}

.articles-card:hover {
  border-color: rgba(103, 194, 58, 0.6);
  box-shadow: 0 8px 32px rgba(103, 194, 58, 0.3);
}

.demos-card:hover {
  border-color: rgba(230, 162, 60, 0.6);
  box-shadow: 0 8px 32px rgba(230, 162, 60, 0.3);
}

.questions-card:hover {
  border-color: rgba(64, 158, 255, 0.6);
  box-shadow: 0 8px 32px rgba(64, 158, 255, 0.3);
}

.chat-card:hover {
  border-color: rgba(168, 85, 247, 0.6);
  box-shadow: 0 8px 32px rgba(168, 85, 247, 0.3);
}

@media (max-width: 768px) {
  .hero-title .title-text {
    font-size: 36px;
    letter-spacing: 2px;
  }

  .hero-title .title-sub {
    font-size: 14px;
    letter-spacing: 4px;
  }

  .nav-cards {
    flex-direction: column;
    align-items: center;
  }

  .nav-card {
    width: 100%;
    max-width: 300px;
  }
}
</style>
