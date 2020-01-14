import { createLabelShape, removeTargetShape, isLabelling } from './labellingProcess';
import { resetCanvasEventsToDefault } from '../toolkit/buttonClickEvents/facade';
import { getContinuousDrawingState, getLastDrawingModeState, setHasDrawnShapeState } from '../toolkit/buttonClickEvents/facadeWorkersUtils/stateManager';
import { resetDrawPolygonMode } from '../../canvas/objects/polygon/polygon';
import { resetDrawBoundingBoxMode } from '../../canvas/objects/boundingBox/boundingBox';
import { getLabelOptions } from '../labelList/labelOptions';
import { displayTickSVGOverImageThumbnail } from '../imageList/imageList';
import {
  hideLabelPopUp, changeStyleWhenInputEmpty,
  changeStyleWhenInputInvalid, changeStyleToAllowSubmit,
} from './style';

let textInputElement = null;
let popupLabelOptions = null;
let oneOrMoreLabelsAdded = false;
let currentlySelectedLabelOption = null;

function preProcessText(text) {
  return text.trim();
}

function changeSubmitButtonStyling() {
  const prepocessedText = preProcessText(textInputElement.value);
  if (prepocessedText === '') {
    changeStyleWhenInputEmpty();
  } else if (prepocessedText === 'new label') {
    changeStyleWhenInputInvalid();
  } else {
    changeStyleToAllowSubmit();
  }
}

function prepareLabelPopupElements() {
  textInputElement = document.getElementById('popup-label-input');
  popupLabelOptions = document.getElementById('popup-label-options');
}

function resetDrawingMode() {
  if (!getContinuousDrawingState()) {
    resetCanvasEventsToDefault();
  } else if (getLastDrawingModeState() === 'polygon') {
    resetDrawPolygonMode();
  } else if (getLastDrawingModeState() === 'boundingBox') {
    resetDrawBoundingBoxMode();
  }
}

function labelShape() {
  const preprocessedText = preProcessText(textInputElement.value);
  if (preprocessedText !== '') {
    createLabelShape();
    setHasDrawnShapeState(true);
    resetDrawingMode();
    displayTickSVGOverImageThumbnail();
    oneOrMoreLabelsAdded = true;
  }
}

function cancelLabellingProcess() {
  if (isLabelling()) {
    hideLabelPopUp();
    removeTargetShape();
    resetDrawingMode();
  }
}

function selectLabelOption(text, element) {
  if (currentlySelectedLabelOption) {
    currentlySelectedLabelOption.id = '';
    currentlySelectedLabelOption.style.backgroundColor = '';
  }
  element.id = 'used';
  currentlySelectedLabelOption = element;
  textInputElement.value = text;
  changeSubmitButtonStyling();
}

function setCaretPosition(caretPos) {
  textInputElement.value = textInputElement.value;
  if (textInputElement.createTextRange) {
    const range = textInputElement.createTextRange();
    range.move('character', caretPos);
    range.select();
    return true;
  }
  if (textInputElement.selectionStart || textInputElement.selectionStart === 0) {
    textInputElement.focus();
    textInputElement.setSelectionRange(caretPos, caretPos);
    return true;
  }
  textInputElement.focus();
  return false;
}

function getPopupLabelOptionsList() {
  if (!oneOrMoreLabelsAdded && popupLabelOptions.childNodes[1]) {
    oneOrMoreLabelsAdded = true;
    return popupLabelOptions.childNodes[1].childNodes;
  }
  return popupLabelOptions.childNodes[0].childNodes;
}

function inputKeyDown(event) {
  if (event.key !== 'Enter') {
    window.setTimeout(() => {
      if (event.code === 'Space') {
        const initialCaretLocation = textInputElement.selectionStart;
        // code for converting spaces to hythons
        // textInputElement.value = textInputElement.value.replace(/\s/g, '-');
        setCaretPosition(initialCaretLocation);
      }
      if (currentlySelectedLabelOption) {
        currentlySelectedLabelOption.style.backgroundColor = '';
        currentlySelectedLabelOption.id = '';
      }
      const popupLabelOptionsList = getPopupLabelOptionsList();
      for (let i = 0; i < popupLabelOptionsList.length; i += 1) {
        if (popupLabelOptionsList[i].childNodes[0].childNodes[0].childNodes[0].innerHTML
            === textInputElement.value) {
          [currentlySelectedLabelOption] = popupLabelOptionsList[i].childNodes;
          currentlySelectedLabelOption.style.backgroundColor = getLabelOptions()[i].color.label;
          currentlySelectedLabelOption.id = 'used';
          currentlySelectedLabelOption.scrollIntoViewIfNeeded();
          break;
        }
      }
      changeSubmitButtonStyling();
    }, 0);
  }
}

function preprocessPastedText(text) {
  const noReturnChars = text.replace(/\n|\r/g, '');
  // code for converting spaces to hythons
  // const spacesToHythons = noReturnChars.replace(/\s/g, '-');
  return noReturnChars;
}

function pasteLabelText() {
  window.setTimeout(() => {
    const initialCaretLocation = textInputElement.selectionStart;
    textInputElement.value = preprocessPastedText(textInputElement.value);
    setCaretPosition(initialCaretLocation);
  }, 0);
}

export {
  labelShape, inputKeyDown, cancelLabellingProcess,
  selectLabelOption, prepareLabelPopupElements, pasteLabelText,
};
