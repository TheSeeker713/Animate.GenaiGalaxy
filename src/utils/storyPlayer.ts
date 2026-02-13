// Standalone Story Player - Vanilla JavaScript (no React)
// This code will be embedded into exported HTML files

export const STORY_PLAYER_CODE = `
class StoryPlayer {
  constructor(data) {
    this.data = data;
    this.currentNodeId = null;
    this.variables = { ...data.variables };
    this.history = [];
    this.displayedText = '';
    this.isTyping = false;
    this.typingInterval = null;
    
    this.init();
  }
  
  init() {
    // Find start node
    const startNode = this.data.nodes.find(n => n.type === 'start');
    if (startNode) {
      this.navigateTo(startNode.id);
    }
  }
  
  navigateTo(nodeId) {
    this.currentNodeId = nodeId;
    this.history.push(nodeId);
    this.render();
  }
  
  goBack() {
    if (this.history.length <= 1) return;
    this.history.pop();
    this.currentNodeId = this.history[this.history.length - 1];
    this.render();
  }
  
  getCurrentNode() {
    return this.data.nodes.find(n => n.id === this.currentNodeId);
  }
  
  getOutgoingEdges(sourceHandle = null) {
    return this.data.edges.filter(e => 
      e.source === this.currentNodeId && 
      (!sourceHandle || e.sourceHandle === sourceHandle)
    );
  }
  
  handleContinue() {
    const edges = this.getOutgoingEdges();
    if (edges.length > 0) {
      this.navigateTo(edges[0].target);
    }
  }
  
  handleChoice(choiceId) {
    const edges = this.getOutgoingEdges(choiceId);
    if (edges.length > 0) {
      this.navigateTo(edges[0].target);
    }
  }
  
  evaluateBranch(condition) {
    try {
      const func = new Function(...Object.keys(this.variables), \`return \${condition}\`);
      return func(...Object.values(this.variables));
    } catch (e) {
      console.error('Branch evaluation error:', e);
      return false;
    }
  }
  
  handleBranch(condition) {
    const result = this.evaluateBranch(condition);
    const edges = this.getOutgoingEdges(result ? 'true' : 'false');
    if (edges.length > 0) {
      setTimeout(() => this.navigateTo(edges[0].target), 500);
    }
  }
  
  handleVariable(data) {
    const currentValue = this.variables[data.key];
    let newValue;
    
    switch (data.operation) {
      case 'set':
        newValue = data.value;
        break;
      case 'add':
        newValue = (Number(currentValue) || 0) + Number(data.value);
        break;
      case 'subtract':
        newValue = (Number(currentValue) || 0) - Number(data.value);
        break;
      case 'toggle':
        newValue = !currentValue;
        break;
      default:
        newValue = data.value;
    }
    
    this.variables[data.key] = newValue;
    setTimeout(() => this.handleContinue(), 500);
  }
  
  typeText(text, callback, isHTML = false) {
    this.displayedText = '';
    this.isTyping = true;
    
    if (isHTML) {
      // For HTML, render immediately without typing effect (HTML typing is complex)
      this.displayedText = text;
      this.isTyping = false;
      this.updateDialogueText(isHTML);
      if (callback) callback();
      return;
    }
    
    let index = 0;
    
    const type = () => {
      if (index < text.length) {
        this.displayedText = text.substring(0, index + 1);
        this.updateDialogueText(isHTML);
        index++;
      } else {
        this.isTyping = false;
        clearInterval(this.typingInterval);
        if (callback) callback();
      }
    };
    
    this.typingInterval = setInterval(type, 30);
  }
  
  skipTyping(text, isHTML = false) {
    clearInterval(this.typingInterval);
    this.displayedText = text;
    this.isTyping = false;
    this.updateDialogueText(isHTML);
  }
  
  updateDialogueText(isHTML = false) {
    const textEl = document.getElementById('dialogue-text');
    if (textEl) {
      if (isHTML) {
        textEl.innerHTML = this.displayedText;
      } else {
        textEl.innerHTML = this.displayedText + (this.isTyping ? '<span class="cursor">|</span>' : '');
      }
    }
  }
  
  render() {
    const node = this.getCurrentNode();
    if (!node) return;
    
    const container = document.getElementById('story-player');
    
    // Auto-handle non-interactive nodes
    if (node.type === 'branch') {
      this.renderBranch(node, container);
      this.handleBranch(node.data.condition);
      return;
    } else if (node.type === 'variable') {
      this.renderVariable(node, container);
      this.handleVariable(node.data);
      return;
    }
    
    // Render interactive nodes
    switch (node.type) {
      case 'start':
        this.renderStart(node, container);
        break;
      case 'dialogue':
        this.renderDialogue(node, container);
        break;
      case 'choice':
        this.renderChoice(node, container);
        break;
      case 'end':
        this.renderEnd(node, container);
        break;
    }
    
    this.renderTopBar();
  }
  
  renderTopBar() {
    const topBar = document.getElementById('top-bar');
    topBar.innerHTML = \`
      <div class="top-bar-left">
        <button onclick="player.goBack()" \${this.history.length <= 1 ? 'disabled' : ''} class="btn-back">
          ← Back
        </button>
        <span class="step-counter">Step \${this.history.length}</span>
      </div>
      <div class="top-bar-right">
        \${Object.keys(this.variables).length > 0 ? \`
          <div class="variables">
            Variables: \${Object.entries(this.variables).map(([k, v]) => \`<span>\${k}: \${v}</span>\`).join(' ')}
          </div>
        \` : ''}
      </div>
    \`;
  }
  
  renderStart(node, container) {
    container.innerHTML = \`
      <div class="node-content center">
        <div class="icon large">📖</div>
        <h1 class="title">\${node.data.label || 'Story Start'}</h1>
        <button onclick="player.handleContinue()" class="btn-primary">Begin Story →</button>
      </div>
    \`;
  }
  
  renderDialogue(node, container) {
    const data = node.data;
    const fullText = data.textHTML || data.text || '';
    const character = data.character;
    const location = data.location;
    const backgroundImage = data.backgroundImage || location?.backgroundImage;
    const foregroundMedia = data.foregroundMedia;
    
    // Set background image if available
    if (backgroundImage && backgroundImage.url) {
      container.style.backgroundImage = 'url(' + backgroundImage.url + ')';
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.position = 'relative';
    } else {
      container.style.backgroundImage = '';
    }
    
    let characterAvatarHTML = '👤';
    if (character && character.thumbnail && character.thumbnail.url) {
      characterAvatarHTML = '<img src="' + character.thumbnail.url + '" alt="' + character.name + '" class="character-thumbnail">';
    }
    
    let characterNameStyle = '';
    if (character && character.color) {
      characterNameStyle = ' style="color: ' + character.color + '"';
    }
    
    let expressionHTML = '';
    if (data.expression) {
      expressionHTML = '<div class="character-expression">' + data.expression + '</div>';
    }
    
    let locationBadgeHTML = '';
    if (location) {
      locationBadgeHTML = '<div class="location-badge">📍 ' + location.name + '</div>';
    }
    
    let foregroundMediaHTML = '';
    if (foregroundMedia && foregroundMedia.url) {
      let mediaContentHTML = '';
      if (foregroundMedia.type === 'video') {
        mediaContentHTML = '<video src="' + foregroundMedia.url + '" controls class="media-content"></video>';
      } else {
        mediaContentHTML = '<img src="' + foregroundMedia.url + '" alt="' + (foregroundMedia.caption || '') + '" class="media-content">';
      }
      
      let captionHTML = '';
      if (foregroundMedia.caption) {
        captionHTML = '<div class="media-caption">' + foregroundMedia.caption + '</div>';
      }
      
      foregroundMediaHTML = '<div class="foreground-media">' + mediaContentHTML + captionHTML + '</div>';
    }
    
    let overlayHTML = backgroundImage ? '<div class="background-overlay"></div>' : '';
    
    container.innerHTML = \`
      <div class="node-content">
        \${overlayHTML}
        
        <div class="character-info">
          <div class="character-avatar">
            \${characterAvatarHTML}
          </div>
          <div class="character-details">
            <div class="character-name"\${characterNameStyle}>
              \${character?.name || data.characterName || 'Character'}
            </div>
            \${expressionHTML}
            \${locationBadgeHTML}
          </div>
        </div>
        
        \${foregroundMediaHTML}
        
        <div class="dialogue-box" onclick="player.isTyping ? player.skipTyping('\${fullText.replace(/'/g, "\\'")}') : null">
          <div id="dialogue-text" class="rich-text"></div>
        </div>
        
        <div id="dialogue-actions"></div>
      </div>
    \`;
    
    this.typeText(fullText, () => {
      document.getElementById('dialogue-actions').innerHTML = \`
        <div class="actions-right">
          <button onclick="player.handleContinue()" class="btn-primary">Continue →</button>
        </div>
      \`;
    }, true); // Pass true to enable HTML rendering
  }
  
  renderChoice(node, container) {
    const data = node.data;
    const location = data.location;
    const backgroundImage = data.backgroundImage || location?.backgroundImage;
    
    // Set background image if available
    if (backgroundImage && backgroundImage.url) {
      container.style.backgroundImage = 'url(' + backgroundImage.url + ')';
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.position = 'relative';
    } else {
      container.style.backgroundImage = '';
    }
    
    const promptHTML = data.textHTML || data.prompt || 'Choose your path';
    let overlayHTML = backgroundImage ? '<div class="background-overlay"></div>' : '';
    let locationBadgeHTML = location ? '<div class="location-badge-center">📍 ' + location.name + '</div>' : '';
    
    let choicesHTML = '';
    data.choices.forEach((choice, i) => {
      const choiceText = choice.textHTML || choice.text || 'Choice ' + (i + 1);
      choicesHTML += \`
        <button onclick="player.handleChoice('\${choice.id}')" class="btn-choice">
          <div class="choice-number">\${i + 1}</div>
          <div class="choice-text">\${choiceText}</div>
        </button>
      \`;
    });
    
    container.innerHTML = \`
      <div class="node-content center">
        \${overlayHTML}
        
        <h2 class="choice-prompt">\${promptHTML}</h2>
        \${locationBadgeHTML}
        <div class="choice-list">
          \${choicesHTML}
        </div>
      </div>
    \`;
  }
  
  renderBranch(node, container) {
    container.innerHTML = \`
      <div class="node-content center">
        <div class="processing">
          <div class="icon large">🌿</div>
          <div class="processing-text">Evaluating condition...</div>
          <code class="condition">\${node.data.condition}</code>
        </div>
      </div>
    \`;
  }
  
  renderVariable(node, container) {
    const data = node.data;
    container.innerHTML = \`
      <div class="node-content center">
        <div class="processing">
          <div class="icon large">⚙️</div>
          <div class="processing-text">Setting variable...</div>
          <code class="condition">\${data.key} = \${String(data.value)}</code>
        </div>
      </div>
    \`;
  }
  
  renderEnd(node, container) {
    const data = node.data;
    const types = {
      victory: { icon: '🏆', color: 'green' },
      defeat: { icon: '💀', color: 'red' },
      neutral: { icon: '🏁', color: 'gray' }
    };
    const type = types[data.endType] || types.neutral;
    
    container.innerHTML = \`
      <div class="node-content center">
        <div class="end-card end-\${type.color}">
          <div class="icon huge">\${type.icon}</div>
          <h1 class="title">\${data.label || 'The End'}</h1>
          <div class="end-type">\${data.endType || 'neutral'} ending</div>
        </div>
        <div class="end-actions">
          <button onclick="player.goBack()" \${this.history.length <= 1 ? 'disabled' : ''} class="btn-secondary">
            ← Go Back
          </button>
          <button onclick="location.reload()" class="btn-primary">
            🔄 Restart Story
          </button>
        </div>
      </div>
    \`;
  }
}

// Initialize player when page loads
let player;
window.addEventListener('DOMContentLoaded', () => {
  player = new StoryPlayer(STORY_DATA);
});
`;

export const STORY_PLAYER_STYLES = `
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #fff;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

#top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}

.top-bar-left, .top-bar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.step-counter {
  font-size: 0.875rem;
  color: #94a3b8;
}

.variables {
  font-size: 0.75rem;
  color: #22d3ee;
  font-family: 'Courier New', monospace;
}

.variables span {
  margin-left: 0.75rem;
}

#story-player {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  overflow-y: auto;
}

.node-content {
  max-width: 48rem;
  width: 100%;
  position: relative;
  z-index: 1;
}

.node-content.center {
  text-align: center;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.85);
  border-radius: 1rem;
  z-index: -1;
}

.character-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.character-avatar {
  width: 5rem;
  height: 5rem;
  background: #334155;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  overflow: hidden;
  flex-shrink: 0;
}

.character-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.character-name {
  font-size: 1.25rem;
  font-weight: bold;
}

.character-expression {
  font-size: 0.875rem;
  color: #94a3b8;
}

.location-badge {
  font-size: 0.75rem;
  color: #22d3ee;
  margin-top: 0.25rem;
}

.location-badge-center {
  font-size: 0.875rem;
  color: #22d3ee;
  margin-bottom: 1rem;
}

.foreground-media {
  margin-bottom: 1.5rem;
  background: rgba(30, 41, 59, 0.9);
  border-radius: 0.75rem;
  padding: 0.5rem;
}

.media-content {
  width: 100%;
  max-height: 400px;
  object-fit: contain;
  border-radius: 0.5rem;
  display: block;
}

.media-caption {
  font-size: 0.875rem;
  color: #94a3b8;
  text-align: center;
  margin-top: 0.5rem;
  font-style: italic;
}

.dialogue-box {
  background: rgba(30, 41, 59, 0.9);
  border: 2px solid rgba(59, 130, 246, 0.3);
  border-radius: 0.75rem;
  padding: 1.5rem;
  min-height: 8rem;
  margin-bottom: 1.5rem;
  cursor: pointer;
}

.dialogue-box p {
  font-size: 1.125rem;
  line-height: 1.75;
  white-space: pre-wrap;
}

.rich-text {
  font-size: 1.125rem;
  line-height: 1.75;
}

.rich-text p {
  margin-bottom: 0.75rem;
}

.rich-text p:last-child {
  margin-bottom: 0;
}

.rich-text h1, .rich-text h2, .rich-text h3 {
  margin-bottom: 0.5rem;
  font-weight: bold;
}

.rich-text ul, .rich-text ol {
  margin-left: 1.5rem;
  margin-bottom: 0.75rem;
}

.rich-text blockquote {
  border-left: 4px solid #3b82f6;
  padding-left: 1rem;
  margin: 0.75rem 0;
  font-style: italic;
  color: #94a3b8;
}

.rich-text code {
  background: rgba(30, 41, 59, 0.8);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.95em;
}

.rich-text pre {
  background: rgba(30, 41, 59, 0.8);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

.rich-text pre code {
  padding: 0;
  background: transparent;
}

.cursor {
  display: inline-block;
  width: 0.125rem;
  height: 1.25rem;
  background: #fff;
  margin-left: 0.25rem;
  animation: blink 1s infinite;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

.actions-right {
  display: flex;
  justify-content: flex-end;
}

.choice-prompt {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1.5rem;
}

.choice-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.btn-choice {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: rgba(147, 51, 234, 0.2);
  border: 2px solid rgba(147, 51, 234, 0.5);
  border-radius: 0.5rem;
  color: #fff;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.btn-choice:hover {
  background: rgba(147, 51, 234, 0.4);
  border-color: rgba(147, 51, 234, 0.8);
  transform: translateX(0.5rem);
}

.choice-number {
  width: 2rem;
  height: 2rem;
  background: #9333ea;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.choice-text {
  flex: 1;
}

.processing {
  padding: 2rem;
  background: rgba(30, 41, 59, 0.9);
  border: 2px solid #f97316;
  border-radius: 1rem;
}

.processing-text {
  font-size: 1.125rem;
  font-weight: 500;
  margin: 1rem 0 0.5rem;
}

.condition {
  display: block;
  font-size: 0.875rem;
  color: #22d3ee;
  font-family: 'Courier New', monospace;
  margin-top: 0.5rem;
}

.end-card {
  padding: 3rem;
  border-radius: 1.5rem;
  border: 4px solid;
  margin-bottom: 2rem;
}

.end-card.end-green {
  background: rgba(34, 197, 94, 0.2);
  border-color: #22c55e;
}

.end-card.end-red {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.end-card.end-gray {
  background: rgba(107, 114, 128, 0.2);
  border-color: #6b7280;
}

.end-type {
  font-size: 1.125rem;
  color: #94a3b8;
  text-transform: capitalize;
  margin-top: 0.5rem;
}

.end-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.icon {
  font-size: 2rem;
}

.icon.large {
  font-size: 3rem;
}

.icon.huge {
  font-size: 5rem;
}

.title {
  font-size: 2.5rem;
  font-weight: bold;
  margin: 1rem 0;
}

button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: #475569;
  color: #fff;
}

.btn-secondary:hover:not(:disabled) {
  background: #334155;
}

.btn-back {
  background: #475569;
  color: #fff;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-back:hover:not(:disabled) {
  background: #334155;
}
`;
