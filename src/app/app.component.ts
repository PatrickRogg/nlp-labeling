import { Component, HostListener } from '@angular/core';
import {
  AngularFirestore,
  QueryDocumentSnapshot,
} from '@angular/fire/firestore';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  i = 0;
  currentLabeledSentence: any = null;
  selectionStart: any = null;
  selectionEnd: any = null;
  currentSentenceDoc: any = null;

  constructor(private firestore: AngularFirestore) {
    this.getTodoSentence();
  }

  async getTodoSentence() {
    const snapshot = await this.firestore
      .collection('sentences')
      .ref.limit(1)
      .get();

    this.currentSentenceDoc = <QueryDocumentSnapshot<any>>snapshot.docs[0];
    this.setNextCurrentSentence(this.currentSentenceDoc);
  }

  async addLabeledSentence() {
    this.firestore
      .collection('labeled-sentences')
      .doc(this.currentLabeledSentence.id)
      .set(this.currentLabeledSentence);
    await this.deleteSentence(this.currentSentenceDoc);
    this.i++;
  }

  async deleteSentence(sentenceDoc: QueryDocumentSnapshot<any>) {
    await sentenceDoc.ref.delete();
    this.getTodoSentence();
    this.selectionStart = null;
    this.selectionEnd = null;
  }

  setNextCurrentSentence(sentenceDoc: QueryDocumentSnapshot<any>) {
    const sentence = sentenceDoc.data();
    const labels = [];

    for (const word of sentence['words']) {
      labels.push('O');
    }

    this.currentLabeledSentence = {
      id: sentence['id'],
      words: sentence['words'],
      labels: labels,
    };
  }

  label(suffix: string) {
    if (!this.selectionStart) {
      return;
    }

    if (!this.selectionEnd) {
      this.selectionEnd = this.selectionStart;
    }

    for (let i = this.selectionStart; i <= this.selectionEnd; i++) {
      let label = suffix;

      if (i === this.selectionStart) {
        if (suffix !== 'O') {
          label = 'B-' + label;
        }
      } else {
        if (suffix !== 'O') {
          label = 'I-' + label;
        }
      }

      this.currentLabeledSentence.labels[i] = label;
    }

    this.selectionStart = null;
    this.selectionEnd = null;
  }

  toggleSelection(i: number) {
    if (this.selectionStart) {
      this.selectionEnd = i;
    } else {
      this.selectionStart = i;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'p') {
      this.label('PRO');
    } else if (event.key === 'c') {
      this.label('CAP');
    } else if (event.key === 'o') {
      this.label('O');
    } else if (event.key === 'd') {
      this.deleteSentence(this.currentSentenceDoc);
    } else if (event.key === 'Escape') {
      this.selectionStart = null;
      this.selectionEnd = null;
    } else if (event.key === 'Enter') {
      this.addLabeledSentence();
    }
  }

  isInRange(i: number) {
    if (this.selectionStart && this.selectionEnd) {
      return i >= this.selectionStart && i <= this.selectionEnd;
    }

    return i === this.selectionStart;
  }
}
