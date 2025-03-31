// 后台服务工作者脚本
chrome.runtime.onInstalled.addListener(() => {
    console.log('KaTeX Highlighter扩展已安装');
});

// 处理权限请求
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'checkClipboardPermission') {
        chrome.permissions.contains({
            permissions: ['clipboardWrite']
        }, (result) => {
            sendResponse({hasPermission: result});
        });
        return true; // 保持消息通道开放
    }
});