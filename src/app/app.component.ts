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
  selectionStart: any = null;
  selectionEnd: any = null;
  selectedSentenceIndex: any = null;
  currentCompany: any = null;

  constructor(private firestore: AngularFirestore) {
    this.getNextPreLabeledData();
  }

  async getNextPreLabeledData() {
    const snapshot = await this.firestore
      .collection('pre-labeled-data')
      .ref.limit(1)
      .where('isLabeled', '==', false)
      .get();

    this.currentCompany = <QueryDocumentSnapshot<any>>snapshot.docs[0].data();
    window.scrollTo(0, 0);
  }

  async save() {
    this.currentCompany['isLabeled'] = true;

    await this.firestore
      .collection('pre-labeled-data')
      .doc(this.currentCompany.id)
      .set(this.currentCompany);

    await this.firestore
      .collection('labeled-data')
      .doc(this.currentCompany.id)
      .set(this.currentCompany);
    this.i++;
    this.getNextPreLabeledData();
    this.resetSelection();
  }

  label(suffix: string) {
    if (this.selectionStart === null || this.selectedSentenceIndex === null) {
      return;
    }

    if (!this.selectionEnd) {
      this.selectionEnd = this.selectionStart;
    }

    for (let i = this.selectionStart; i <= this.selectionEnd; i++) {
      let label = suffix;

      if (suffix === 'O') {

      } else if (this.selectionStart === this.selectionEnd) {
        label = 'U-' + label;
      } else if (i === this.selectionStart) {
        if (suffix !== 'O') {
          label = 'B-' + label;
        }
      } else if (i == this.selectionEnd) {
        if (suffix !== 'O') {
          label = 'L-' + label;
        }
      } else {
        if (suffix !== 'O') {
          label = 'I-' + label;
        }
      }

      this.currentCompany.sentences[this.selectedSentenceIndex].labels[i] = label;
    }

    this.resetSelection();
  }

  toggleSelection(sentenceIndex: number, wordIndex: number) {
    this.selectedSentenceIndex = sentenceIndex;
    if (this.selectionStart !== null) {
      this.selectionEnd = wordIndex;

      if (this.selectionStart > this.selectionEnd) {
        this.selectionEnd = this.selectionStart;
        this.selectionStart = wordIndex;
      }
    } else {
      this.selectionStart = wordIndex;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyEvent(event: KeyboardEvent) {
    if (event.key === 'p') {
      this.label('PRO');
    } else if (event.key === 's') {
      this.label('SKILL');
    } else if (event.key === 'o') {
      this.label('O');
    } else if (event.key === 'Escape') {
      this.resetSelection();
    }
  }

  private resetSelection() {
    this.selectionStart = null;
    this.selectionEnd = null;
    this.selectedSentenceIndex = null;
  }

  isInRange(sentenceIndex: number, wordIndex: number) {
    if (sentenceIndex !== this.selectedSentenceIndex) {
      return false;
    }

    if (this.selectionStart !== null && this.selectionEnd !== null) {
      return wordIndex >= this.selectionStart && wordIndex <= this.selectionEnd;
    }

    return wordIndex === this.selectionStart;
  }
}
