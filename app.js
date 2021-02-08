//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; 						//stream from getUserMedia()
var rec; 							//Recorder.js object
var input; 							//MediaStreamAudioSourceNode we'll be recording

var exportRec;

// shim for AudioContext when it's not avb. 
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext //audio context to help us record

var recordButton = document.getElementById("recordButton");
var stopButton = document.getElementById("stopButton");
var pauseButton = document.getElementById("pauseButton");
var btnDiagnose = document.getElementById("btnDiagnose");
var filenameInput = document.getElementById("filenameInput");

//add events to those 2 buttons
recordButton.addEventListener("click", startRecording);
stopButton.addEventListener("click", stopRecording);
pauseButton.addEventListener("click", pauseRecording);




function startRecording() {
	console.log("recordButton clicked");

	/*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/
    
    var constraints = { audio: true, video:false }

 	/*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

	recordButton.disabled = true;
	stopButton.disabled = false;
	pauseButton.disabled = false

	/*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

	navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
		console.log("getUserMedia() success, stream created, initializing Recorder.js ...");

		/*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device
		*/
		audioContext = new AudioContext();

		//update the format 
		document.getElementById("formats").innerHTML="Format: 1 channel pcm @ "+audioContext.sampleRate/1000+"kHz"

		/*  assign to gumStream for later use  */
		gumStream = stream;
		
		/* use the stream */
		input = audioContext.createMediaStreamSource(stream);

		/* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
		rec = new Recorder(input,{numChannels:1})

		//start the recording process
		rec.record()

		console.log("Recording started");

	}).catch(function(err) {
	  	//enable the record button if getUserMedia() fails
    	recordButton.disabled = false;
    	stopButton.disabled = true;
    	pauseButton.disabled = true
	});
}

function pauseRecording(){
	console.log("pauseButton clicked rec.recording=",rec.recording );
	if (rec.recording){
		//pause
		rec.stop();
		pauseButton.innerHTML="Resume";
	}else{
		//resume
		rec.record()
		pauseButton.innerHTML="Pause";

	}
}

function stopRecording() {
	console.log("stopButton clicked");

	//disable the stop button, enable the record too allow for new recordings
	stopButton.disabled = true;
	recordButton.disabled = false;
	pauseButton.disabled = true;

	//reset button just in case the recording is stopped while paused
	pauseButton.innerHTML="Pause";
	
	//tell the recorder to stop the recording
	rec.stop();

	//stop microphone access
	gumStream.getAudioTracks()[0].stop();

	//create the wav blob and pass it on to createDownloadLink
	exportRec = rec.exportWAV(parkinsonDiagnose);
	//rec.exportWAV(createDownloadLink);
	//rec.exportWAV(parkinsonDiagnose);
}

function parkinsonDiagnose(blob) {

	//var url1 = URL.createObjectURL(blob);
//video.srcObject = stream
	//var url = URL.createObjectURL(blob);

//name of .wav file to use during upload and download (without extendion)
//var filename = new Date().toISOString();

var filename = "parkinsons_voice_analysis"

//add controls to the <audio> element
//au.controls = true;
//au.src = url;

//save to disk link
//ink.href = rec;
//link.download = filename+".wav"; //download forces the browser to donwload the file using the  filename
//link.innerHTML = "Save to disk";

	
try {
// Get a reference to the storage service, which is used to create references in your storage bucket
	var storage = firebase.storage();

	// Create a storage reference from our storage service
	var ref = storage.ref();
	
	/*var file = blob; // use the Blob or File API
	ref.child().put(file).then(function(snapshot) {
	console.log('Uploaded a blob or file!');
	});*/

	var file = blob;

	var uploadTask = ref.child('audio/' + filename + ".wav").put(file);
}
catch(error) {
	console.log("error");
	console.log(error);
}

filenameInput.value = filename + ".wav"

}

btnDiagnose.addEventListener("click", parkinsonDiagnose);


