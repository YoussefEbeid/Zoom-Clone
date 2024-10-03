const socket = io('/')  // Initializes a Socket.IO connection to the server's root URL.

const videoGrid = document.getElementById('video-grid')  // Selects the HTML element where video streams will be displayed.

const myPeer = new Peer(undefined, {  // Creates a new peer connection using PeerJS, setting up WebRTC. The 'undefined' means PeerJS will auto-generate an ID.
    path: '/peerjs',  // Specifies the path for the PeerJS server.
    host: '/',  // Connect to the root of the current domain.
    port: '443'  // Uses port 443 (for HTTPS connections).
})

let myVideoStream;  // Declares a variable to hold the local video stream.

const myVideo = document.createElement('video')  // Creates a video element to display your own video stream.
myVideo.muted = true;  // Mutes your own video stream to prevent echo.

const peers = {}  // Initializes an empty object to keep track of connected peers.

navigator.mediaDevices.getUserMedia({  // Requests access to the user's camera and microphone.
    video: true,  // Requests video access.
    audio: true  // Requests audio access.
}).then(stream => {
    myVideoStream = stream;  // Stores the local media stream (video + audio).
    addVideoStream(myVideo, stream)  // Adds your own video stream to the page.

    myPeer.on('call', call => {  // Listens for incoming calls from other users.
        call.answer(stream)  // Answers the call and sends your video stream to the caller.
        const video = document.createElement('video')  // Creates a video element for the caller's stream.
        call.on('stream', userVideoStream => {  // When the caller's stream is received, display it.
            addVideoStream(video, userVideoStream)
        })
    })

    socket.on('user-connected', userId => {  // Listens for new users joining the room.
        connectToNewUser(userId, stream)  // Calls the function to connect the new user and share the stream.
    })

    let text = $("input");  // Selects the input field for sending messages.

    $('html').keydown(function (e) {  // Listens for a keydown event in the whole document.
        if (e.which == 13 && text.val().length !== 0) {  // If the 'Enter' key is pressed and the input isn't empty...
            socket.emit('message', text.val());  // Sends the message to the server.
            text.val('')  // Clears the input field.
        }
    });

    socket.on("createMessage", message => {  // Listens for messages from the server.
        $("ul").append(`<li class="message"><b>user</b><br/>${message}</li>`);  // Appends the message to the chat.
        scrollToBottom()  // Scrolls the chat to the bottom.
    })
})

socket.on('user-disconnected', userId => {  // Listens for a user disconnecting.
    if (peers[userId]) peers[userId].close()  // Closes the connection with the disconnected user.
})

myPeer.on('open', id => {  // When PeerJS is ready and has an ID...
    socket.emit('join-room', ROOM_ID, id)  // Emits a 'join-room' event to the server, passing the room ID and user ID.
})

function connectToNewUser(userId, stream) {  // Handles connecting to a new user.
    const call = myPeer.call(userId, stream)  // Calls the new user and shares the local stream.
    const video = document.createElement('video')  // Creates a new video element for the new user.
    call.on('stream', userVideoStream => {  // When the new user's stream is received, display it.
        addVideoStream(video, userVideoStream)
    })
    call.on('close', () => {  // If the call is closed, remove the user's video from the page.
        video.remove()
    })

    peers[userId] = call  // Store the peer connection in the `peers` object.
}

function addVideoStream(video, stream) {  // Adds a video stream to the page.
    video.srcObject = stream  // Sets the source of the video element to the user's stream.
    video.addEventListener('loadedmetadata', () => {  // Once the video metadata is loaded...
        video.play()  // Start playing the video.
    })
    videoGrid.append(video)  // Append the video element to the video grid.
}

const scrollToBottom = () => {  // Scrolls the chat window to the bottom.
    var d = $('.main__chat_window');
    d.scrollTop(d.prop("scrollHeight"));
}

const muteUnmute = () => {  // Toggles the microphone on or off.
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;  // Mutes the audio.
        setUnmuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;  // Unmutes the audio.
    }
}

const playStop = () => {  // Toggles the video on or off.
    let enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;  // Stops the video.
        setPlayVideo()
    } else {
        setStopVideo()
        myVideoStream.getVideoTracks()[0].enabled = true;  // Starts the video.
    }
}

const setMuteButton = () => {  // Sets the button to show 'Mute' when audio is enabled.
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setUnmuteButton = () => {  // Sets the button to show 'Unmute' when audio is muted.
    const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `
    document.querySelector('.main__mute_button').innerHTML = html;
}

const setStopVideo = () => {  // Sets the button to show 'Stop Video' when video is enabled.
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}

const setPlayVideo = () => {  // Sets the button to show 'Play Video' when video is disabled.
    const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `
    document.querySelector('.main__video_button').innerHTML = html;
}
