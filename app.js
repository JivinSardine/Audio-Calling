// app.js
const localVideo = document.querySelector('#localVideo');
const remoteVideo = document.querySelector('#remoteVideo');
const callButton = document.querySelector('#callButton');
const hangupButton = document.querySelector('#hangupButton');

let localStream;
let pc1;
let pc2;

const constraints = { audio: true, video: false };

function gotStream(stream) {
  console.log('Received local stream');
  localVideo.srcObject = stream;
  localStream = stream;
}

function start() {
  console.log('Requesting local stream');
  navigator.mediaDevices.getUserMedia(constraints)
      .then(gotStream)
      .catch(e => console.log('getUserMedia() error: ' + e.name));
}

function call() {
  console.log('Starting call');
  const servers = null;
  pc1 = new RTCPeerConnection(servers);
  pc1.addEventListener('icecandidate', e => onIceCandidate(pc1, e));
  pc2 = new RTCPeerConnection(servers);
  pc2.addEventListener('icecandidate', e => onIceCandidate(pc2, e));
  pc2.addEventListener('track', gotRemoteStream);

  localStream.getTracks().forEach(track => pc1.addTrack(track, localStream));
  console.log('Added local stream to pc1');

  pc1.createOffer()
      .then(desc => {
        pc1.setLocalDescription(desc);
        console.log(`Offer from pc1\n${desc.sdp}`);
        pc2.setRemoteDescription(desc);
        return pc2.createAnswer();
      })
      .then(desc => {
        pc2.setLocalDescription(desc);
        console.log(`Answer from pc2\n${desc.sdp}`);
        pc1.setRemoteDescription(desc);
      })
      .catch(err => console.log(err));
}

function onIceCandidate(pc, event) {
  getOtherPc(pc).addIceCandidate(event.candidate)
      .then(
          () => console.log('Ice candidate added'),
          err => console.log(`Error adding ice candidate: ${err}`)
      );
  console.log(`${getName(pc)} ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

function gotRemoteStream(e) {
  console.log('Received remote stream');
  remoteVideo.srcObject = e.streams[0];
}

function hangup() {
  console.log('Ending call');
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
}

function getName(pc) {
  return (pc === pc1) ? 'pc1' : 'pc2';
}

function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

start();
callButton.addEventListener('click', call);
hangupButton.addEventListener('click', hangup);
