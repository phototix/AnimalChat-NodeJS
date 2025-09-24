const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = 4001;

// In-memory chat history
let chatHistory = [];

// Random animal names in Simplified Chinese
const animals = [
  "狮子","老虎","大象","长颈鹿","熊猫","考拉","斑马","狼","狐狸","熊",
  "兔子","猴子","企鹅","海豚","鲨鱼","水獺","马","狗","猫","猫头鹰"
];

// Track animal names currently in use
let inUseAnimals = new Set();

function getRandomUnusedAnimal() {
  const unused = animals.filter(a => !inUseAnimals.has(a));
  if (unused.length === 0) return null;
  return unused[Math.floor(Math.random() * unused.length)];
}

app.use(express.static('public'));

function sendOnlineAnimals() {
  io.emit('online animals', Array.from(inUseAnimals));
}

io.on('connection', (socket) => {
    const username = getRandomUnusedAnimal();

    if (!username) {
        // No names available, refuse joining
        socket.emit('chat blocked', { msg: '聊天室已满，请稍后再试。' });
        socket.disconnect(true);
        return;
    }

    socket.username = username;
    inUseAnimals.add(username);

    // Send previous chat history
    socket.emit('chat history', chatHistory);

    // Notify user joined (Simplified Chinese)
    io.emit('chat message', { user: '系统', msg: `${username} 已加入聊天室。` });
    chatHistory.push({ user: '系统', msg: `${username} 已加入聊天室。` });
    
    // 新增：广播当前在线动物
    sendOnlineAnimals();

    socket.on('chat message', (msg) => {
        // Only allow if user is in useAnimals (double check)
        if (inUseAnimals.has(socket.username)) {
            const message = { user: username, msg };
            chatHistory.push(message);
            io.emit('chat message', message);
        }
    });

    socket.on('disconnect', () => {
        io.emit('chat message', { user: '系统', msg: `${username} 已离开聊天室。` });
        chatHistory.push({ user: '系统', msg: `${username} 已离开聊天室。` });
        inUseAnimals.delete(username);
        // 新增：广播当前在线动物
        sendOnlineAnimals();
    });
});

http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
