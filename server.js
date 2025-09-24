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

function getRandomAnimal() {
  return animals[Math.floor(Math.random() * animals.length)];
}

app.use(express.static('public'));

io.on('connection', (socket) => {
    const username = getRandomAnimal();
    socket.username = username;

    // Send previous chat history
    socket.emit('chat history', chatHistory);

    // Notify user joined (Simplified Chinese)
    io.emit('chat message', { user: '系统', msg: `${username} 已加入聊天室。` });
    chatHistory.push({ user: '系统', `${username} 已加入聊天室。` });

    socket.on('chat message', (msg) => {
        const message = { user: username, msg };
        chatHistory.push(message);
        io.emit('chat message', message);
    });

    socket.on('disconnect', () => {
        io.emit('chat message', { user: '系统', msg: `${username} 已离开聊天室。` });
    });
});

http.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
