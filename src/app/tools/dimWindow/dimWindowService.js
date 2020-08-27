import { onMouseMoveEvent } from '../../keyEvents/mouse/mouseMove';
import { QUICK_DIM_SECONDS, THIN_DIM, QUICK_LIGHTUP_MILLISECONDS } from './consts';

let windowDimElement = null;
let canvas = null;
const IS_CROSSHAIR_MODE_ON = true;

function initiateLightUp(transitionDurationMilliseconds) {
  windowDimElement.style.backgroundColor = 'rgba(0,0,0,0)';
  window.setTimeout(() => {
    windowDimElement.style.position = 'unset';
    // if the mouse is not refreshing correctly, consider setting a timeout for dispatch event
    canvas.upperCanvasEl.dispatchEvent(new Event('mousemove'));
  }, transitionDurationMilliseconds);
}

function overrideLightUpIfSpecialState() {
  // && currently in draw bounding box events
  // if the modal is not being closed fast enough for the crosshair, consider setting this to 0 and
  // using a lighter dim color - previous findings may favour such case for upload and ML modals
  if (IS_CROSSHAIR_MODE_ON) {
    initiateLightUp(QUICK_LIGHTUP_MILLISECONDS);
    return true;
  }
  return false;
}

function lightUpWindow(transitionDurationMilliseconds, overrideMode) {
  const overriden = overrideLightUpIfSpecialState(overrideMode);
  if (overriden) return;
  initiateLightUp(transitionDurationMilliseconds);
}

function initiateDim(transitionDurationSeconds, backgroundColor) {
  windowDimElement.style.transitionDuration = `${transitionDurationSeconds}s`;
  windowDimElement.style.MozTransitionDuration = `${transitionDurationSeconds}s`;
  windowDimElement.style.position = 'absolute';
  windowDimElement.style.backgroundColor = backgroundColor;
}

function overrideDimIfSpecialState() {
  // && currently in draw bounding box events
  if (IS_CROSSHAIR_MODE_ON) {
    initiateDim(QUICK_DIM_SECONDS, THIN_DIM);
    return true;
  }
  return false;
}

function dimWindow(transitionDurationSeconds, backgroundColor) {
  const overriden = overrideDimIfSpecialState();
  if (overriden) return;
  initiateDim(transitionDurationSeconds, backgroundColor);
}

function assignCanvasToDimWindowService(canvasObj) {
  canvas = canvasObj;
}

function addMouseMoveEventListener() {
  windowDimElement.addEventListener('mousemove', onMouseMoveEvent);
}

function assignLocalVariables() {
  windowDimElement = document.getElementById('window-dim');
}

function initialiseWindowDimService() {
  assignLocalVariables();
  addMouseMoveEventListener();
}

export {
  initialiseWindowDimService, assignCanvasToDimWindowService, dimWindow, lightUpWindow,
};
