export interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionError) => void;
  start: () => void;
  stop: () => void;
}
export interface SpeechRecognitionError extends Event {
  error: string;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}
interface Window {
  webkitSpeechRecognition: SpeechRecognitionConstructor;
}

type ResultCallback = (transcript: string) => void;
type EndCallback = () => void;
type ErrorCallback = (event: SpeechRecognitionError) => void;

export class VoiceService {
  private recognition: SpeechRecognition | null;
  private isRecording: boolean;
  private speechTimeout: number | null;
  private onResultCallback: ResultCallback | null;
  private onEndCallback: EndCallback | null;
  private onErrorCallback: ErrorCallback | null;
  private onInactivityCallback: (() => void) | null = null;

  constructor() {
    this.recognition = null;
    this.isRecording = false;
    this.speechTimeout = null;
    this.onResultCallback = null;
    this.onEndCallback = null;
    this.onErrorCallback = null;

    this.initializeSpeechRecognition();
  }

  private initializeSpeechRecognition(): void {
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new (
        window as unknown as Window
      ).webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        if (this.onResultCallback) {
          this.onResultCallback(transcript);
        }

        if (this.speechTimeout) {
          clearTimeout(this.speechTimeout);
        }

        this.speechTimeout = window.setTimeout(() => {
          if (this.isRecording && transcript.trim()) {
            this.stop();
            if (this.onInactivityCallback) {
              this.onInactivityCallback();
            }
          }
        }, 2500);
      };

      this.recognition.onend = () => {
        if (this.onEndCallback) {
          this.onEndCallback();
        }
      };

      this.recognition.onerror = (event: SpeechRecognitionError) => {
        if (this.onErrorCallback) {
          this.onErrorCallback(event);
        }
      };
    }
  }
  public setOnInactivity(callback: () => void): void {
    this.onInactivityCallback = callback;
  }

  public start(): void {
    if (!this.recognition) return;

    this.isRecording = true;
    this.recognition.start();
  }

  public stop(): void {
    if (!this.recognition) return;

    this.isRecording = false;
    this.recognition.stop();
    if (this.speechTimeout) {
      clearTimeout(this.speechTimeout);
    }
  }

  public setOnResult(callback: ResultCallback): void {
    this.onResultCallback = callback;
  }

  public setOnEnd(callback: EndCallback): void {
    this.onEndCallback = callback;
  }

  public setOnError(callback: ErrorCallback): void {
    this.onErrorCallback = callback;
  }

  public isSupported(): boolean {
    return "webkitSpeechRecognition" in window;
  }
}
