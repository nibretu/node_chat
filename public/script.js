// Connect to Socket.IO
const socket = io();

// DOM Elements
const roomList = document.getElementById('room-list');
const messagesContainer = document.getElementById('messages-container');
const messageInput = document.getElementById('message-input');
const sendBtn = document.getElementById('send-btn');
const currentRoomName = document.getElementById('current-room-name');
const usernameDisplay = document.getElementById('username-display');
const newRoomNameInput = document.getElementById('new-room-name');
const createRoomBtn = document.getElementById('create-room-btn');

let currentRoomId = null;
let username = localStorage.getItem('chatUsername');

// 1. Handle Username
if (!username) {
  username = prompt('Please enter your username:');

  if (username) {
    localStorage.setItem('chatUsername', username);
  } else {
    username = 'Anonymous';
  }
}
usernameDisplay.textContent = `Logged in as: ${username}`;

// 2. Fetch and Render Rooms
async function fetchRooms() {
  try {
    const res = await fetch('/api/rooms');
    const rooms = await res.json();

    roomList.innerHTML = '';

    rooms.forEach((room) => {
      const li = document.createElement('li');

      li.textContent = room.name;
      li.dataset.id = room._id;
      li.onclick = () => joinRoom(room._id, room.name, li);
      roomList.appendChild(li);
    });
  } catch (err) {
    console.error('Error fetching rooms:', err);
  }
}

// 3. Join a Room
function joinRoom(roomId, roomName, element) {
  // Leave previous room if any
  if (currentRoomId) {
    socket.emit('leaveRoom', { roomId: currentRoomId, username });
  }

  // Update UI
  document
    .querySelectorAll('#room-list li')
    .forEach((li) => li.classList.remove('active'));

  if (element) {
    element.classList.add('active');
  }

  currentRoomId = roomId;
  currentRoomName.textContent = roomName;
  messagesContainer.innerHTML = ''; // Clear old messages

  // Enable inputs
  messageInput.disabled = false;
  sendBtn.disabled = false;
  messageInput.focus();

  // Emit join event to server
  socket.emit('joinRoom', { roomId, username });
}

// 4. Create a Room
createRoomBtn.onclick = async () => {
  const roomName = newRoomNameInput.value.trim();

  if (!roomName) {
    return;
  }

  try {
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: roomName }), // <-- FIXED HERE
    });
    const data = await res.json();

    if (res.ok) {
      newRoomNameInput.value = '';
      fetchRooms(); // Refresh the room list
    } else {
      alert(data.error || 'Failed to create room');
    }
  } catch (err) {
    console.error('Error creating room:', err);
  }
};

// 5. Send a Message
sendBtn.onclick = () => {
  const text = messageInput.value.trim();

  if (!text || !currentRoomId) {
    return;
  }

  socket.emit('sendMessage', { roomId: currentRoomId, author: username, text });
  messageInput.value = '';
};

messageInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
});

// 6. Handle Incoming Socket Events
socket.on('messageHistory', (messages) => {
  messagesContainer.innerHTML = '';
  messages.forEach(addMessageToUI);
});

socket.on('message', (message) => {
  addMessageToUI(message);
});

socket.on('roomCreated', () => {
  fetchRooms(); // Refresh the room list when someone else creates a room
});

// Helper function to render a message
function addMessageToUI(message) {
  const div = document.createElement('div');

  div.classList.add('message');

  if (message.author === username) {
    div.classList.add('own');
  }

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  div.innerHTML = `
    <div class="meta">${message.author} • ${time}</div>
    <div class="text">${message.text}</div>
  `;

  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight; // Auto-scroll
}

// Initial Fetch
fetchRooms();
