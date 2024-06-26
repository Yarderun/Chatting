var socket = io();
var username;

while (!username) {
    username = prompt('Lütfen adınızı girin:');
}

socket.emit('set username', username);

var form = document.getElementById('form');
var input = document.getElementById('input');
var fileInput = document.getElementById('fileInput');

if (Notification.permission !== 'granted') {
    Notification.requestPermission();
}

form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (input.value) {
        socket.emit('chat message', { username: username, message: input.value });
        input.value = '';
    }
});

fileInput.addEventListener('change', function () {
    var file = fileInput.files[0];
    if (file) {
        var reader = new FileReader();
        reader.onload = function (e) {
            socket.emit('file upload', { username: username, fileName: file.name, fileData: e.target.result });
        };
        reader.readAsDataURL(file);
    }
});

function appendMessage(msg) {
    var item = document.createElement('li');
    item.setAttribute('data-id', msg.id); // Her mesaj için id ekleyin
    var usernameSpan = document.createElement('span');
    var messageSpan = document.createElement('span');

    usernameSpan.textContent = msg.username + ': ';
    messageSpan.textContent = msg.message;

    usernameSpan.classList.add('username');
    messageSpan.classList.add('message');

    item.appendChild(usernameSpan);
    item.appendChild(messageSpan);

    // Sadece kendi mesajlarımız için silme düğmesini gösterelim
    if (msg.username === username) {
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Sil';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function () {
            // Silme isteğini sunucuya gönder
            socket.emit('delete message', msg);
            // Mesajı DOM'dan kaldır
            item.remove();
        });
        item.appendChild(deleteButton);
    }

    document.getElementById('messages').appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

function appendFile(data) {
    var item = document.createElement('li');
    item.setAttribute('data-id', data.id); // Her dosya için id ekleyin
    var usernameSpan = document.createElement('span');
    usernameSpan.textContent = data.username + ': ';
    usernameSpan.classList.add('username');

    if (data.fileName.match(/\.(jpeg|jpg|gif|png|PNG)$/)) {
        var img = document.createElement('img');
        img.src = data.fileData;
        img.classList.add('uploaded-image');
        item.appendChild(usernameSpan);
        item.appendChild(img);
    } else {
        var fileLink = document.createElement('a');
        fileLink.href = data.fileData;
        fileLink.textContent = data.fileName;
        fileLink.download = data.fileName;
        fileLink.classList.add('uploaded-file');
        item.appendChild(usernameSpan);
        item.appendChild(fileLink);
    }

    // Sadece kendi dosyalarımız için silme düğmesini gösterelim
    if (data.username === username) {
        var deleteButton = document.createElement('button');
        deleteButton.textContent = 'Sil';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', function () {
            // Silme isteğini sunucuya gönder
            socket.emit('delete file', data);
            // Dosyayı DOM'dan kaldır
            item.remove();
        });
        item.appendChild(deleteButton);
    }

    document.getElementById('messages').appendChild(item);
    window.scrollTo(0, document.body.scrollHeight);
}

socket.on('message deleted', function (msg) {
    // Silinen mesajı DOM'dan kaldır
    var messages = document.getElementById('messages');
    var items = messages.getElementsByTagName('li');
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.getAttribute('data-id') === msg.id) {
            item.remove();
            break;
        }
    }
});

socket.on('file deleted', function (data) {
    var messages = document.getElementById('messages');
    var items = messages.getElementsByTagName('li');
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        if (item.getAttribute('data-id') === data.id) {
            item.remove();
            break;
        }
    }
});

socket.on('chat message', function (msg) {
    appendMessage(msg);
    if (msg.username !== username && Notification.permission === 'granted') {
        new Notification('Yeni Mesaj', {
            body: `${msg.username}: ${msg.message}`,
        });
    }
});

socket.on('file upload', function (data) {
    appendFile(data);
    if (data.username !== username && Notification.permission === 'granted') {
        new Notification('Yeni Dosya', {
            body: `${data.username} bir dosya gönderdi.`,
        });
    }
});

socket.on('clear chat', function () {
    document.getElementById('messages').innerHTML = '';
});

socket.on('username exists', function () {
    alert('Bu kullanıcı adı zaten kullanılıyor, lütfen başka bir ad seçin.');
    username = null;
    while (!username) {
        username = prompt('Lütfen adınızı girin:');
    }
    socket.emit('set username', username);
});
