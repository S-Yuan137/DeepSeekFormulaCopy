// 检测DeepSeek网页的Katex元素
function queryShadowRoot(root, selector) {
  const results = [];
  // 检查当前层
  results.push(...root.querySelectorAll(selector));
  // 递归检查Shadow DOM
  root.querySelectorAll("*").forEach(node => {
    if (node.shadowRoot) {
      results.push(...queryShadowRoot(node.shadowRoot, selector));
    }
  });
  return results;
}

// 增强公式源码提取逻辑
function extractLatexFromElement(element) {
    // 情况1：直接从属性获取
    if (element.hasAttribute('data-latex')) {
        return element.getAttribute('data-latex');
    }

    // 情况2：从SVG的<annotation>获取
    const annotation = element.querySelector('annotation');
    if (annotation?.textContent) {
        return annotation.textContent.trim();
    }

    // 情况3：从图片的alt文本获取
    if (element.tagName === 'IMG' && element.alt) {
        return element.alt.trim();
    }

    // 情况4: kimi的公式
    // 优先检查data-latex属性
    if (element.hasAttribute('data-latex')) {
        return element.getAttribute('data-latex');
    }
    // 其次检查子元素的文本内容
    const latexElement = element.querySelector('.latex-source, [data-math]');
    if (latexElement?.textContent) {
        return latexElement.textContent.trim();
    }
    
    // 情况5: 递归提取嵌套元素文本
    
}

// 添加复制按钮和事件监听
// 使用事件委托优化事件监听
function addCopyButtonsToKatex() {
    // 检测标准.katex元素和DeepSeek可能的自定义元素
    const katexElements = queryShadowRoot(document.body, '.katex, .ds-math, .formula-box, katex-html');
    
    if (katexElements.length > 0) {
        // 为每个元素添加标记避免重复处理
        katexElements.forEach(element => {
            if (!element.dataset.katexProcessed) {
                element.dataset.katexProcessed = 'true';
                const originalColor = element.style.backgroundColor;
                
                element.addEventListener('dblclick', function handleDblClick() {
                    // element.style.transition = 'background-color 0.3s';
                    // element.style.backgroundColor = 'orange';
                    // 
                    // const highlightTimeout = setTimeout(() => {
                    //     element.style.backgroundColor = originalColor || '';
                    // }, 300);
                    
                    // 获取并复制KaTeX源码
                    const katexSource = extractLatexFromElement(element);
                    
                    // 使用事件对象避免闭包
                    const copyHandler = () => {
                        // clearTimeout(highlightTimeout);
                        
                        // 尝试使用现代剪贴板API
                        navigator.clipboard.writeText(katexSource).then(() => {
                            showCopyMessage('复制成功: ' + katexSource, true);
                        }).catch(err => {
                            // 如果剪贴板API失败，尝试备用方法
                            try {
                                const textarea = document.createElement('textarea');
                                textarea.value = katexSource;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand('copy');
                                document.body.removeChild(textarea);
                                showCopyMessage('复制成功: ' + katexSource, true);
                            } catch (backupErr) {
                                showCopyMessage('复制失败: ' + backupErr, false);
                            }
                        });
                    };
                    
                    copyHandler();
                });
            }
        });
    }
}

// 显示复制消息
// 缓存消息元素避免频繁创建
let cachedMessage = null;

function showCopyMessage(message, isSuccess) {
    if (!cachedMessage) {
        cachedMessage = document.createElement('div');
        cachedMessage.style.position = 'fixed';
        cachedMessage.style.top = '20px';
        cachedMessage.style.left = '50%';
        cachedMessage.style.transform = 'translateX(-50%)';
        cachedMessage.style.padding = '10px';
        cachedMessage.style.zIndex = '2147483647';
        cachedMessage.style.borderRadius = '5px';
        cachedMessage.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
        document.body.appendChild(cachedMessage);
    }
    
    cachedMessage.textContent = message;
    cachedMessage.style.backgroundColor = isSuccess ? '#4CAF50' : '#f44336';
    cachedMessage.style.color = 'white';
    
    // 清除之前的定时器
    if (cachedMessage.timeoutId) {
        clearTimeout(cachedMessage.timeoutId);
    }
    
    cachedMessage.timeoutId = setTimeout(() => {
        if (cachedMessage && cachedMessage.parentNode) {
            cachedMessage.parentNode.removeChild(cachedMessage);
            cachedMessage = null;
        }
    }, 300);
}

// 监听动态内容变化
// 使用防抖函数优化MutationObserver回调
const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
};

const optimizedObserverCallback = debounce((mutations) => {
    const hasNewNodes = mutations.some(mutation => mutation.addedNodes.length);
    if (hasNewNodes) {
        addCopyButtonsToKatex();
    }
}, 300);

const observer = new MutationObserver(optimizedObserverCallback);

observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: false,
    characterData: false
});

// 初始执行
addCopyButtonsToKatex();