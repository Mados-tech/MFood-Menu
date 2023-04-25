importScripts('https://www.gstatic.com/firebasejs/8.1.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.1.1/firebase-messaging.js');

// Initialize Firebase
firebase.initializeApp({
    apiKey: "AIzaSyBxkabccm8TDL6ku0nrrUQHtbv5w2upm3s",
    authDomain: "beststore-b8257.firebaseapp.com",
    projectId: "beststore-b8257",
    storageBucket: "beststore-b8257.appspot.com",
    messagingSenderId: "175988176537",
    appId: "1:175988176537:web:1840fd9820391d59bbaa08"
});

const channel = new BroadcastChannel('sw-messages');

firebase.messaging().onBackgroundMessage((payload) => {
    channel.postMessage(payload);
    return self.registration.showNotification(payload.notification.title);
});