import * as BABYLON from '@babylonjs/core';

export const BOARD_SIZE = 8;
export const SQUARE_SIZE = 1;
export const BOARD_OFFSET = (BOARD_SIZE * SQUARE_SIZE) / 2;

export const COLORS = {
  WHITE: new BABYLON.Color3(0.9, 0.9, 0.9),
  BLACK: new BABYLON.Color3(0.2, 0.2, 0.2),
  RUST: new BABYLON.Color3(183/255, 65/255, 14/255),
  LIGHT_SQUARE: new BABYLON.Color3(0.8, 0.8, 0.7),
  DARK_SQUARE: new BABYLON.Color3(0, 0, 0),
  EXTENDED_LIGHT: new BABYLON.Color3(0.35, 0.35, 0.35),
  EXTENDED_DARK: new BABYLON.Color3(0.25, 0.25, 0.25),
  VALID_MOVE_HIGHLIGHT: new BABYLON.Color3(0.2, 0.8, 0.2),
  CHECK_HIGHLIGHT: new BABYLON.Color3(0.6, 0.1, 0.8),
  ENDANGERED_HIGHLIGHT: new BABYLON.Color3(0.9, 0.1, 0.1),
  SELECTED_HIGHLIGHT: new BABYLON.Color3(0.9, 0.9, 0.2),
  FRIENDLY_HIGHLIGHT: new BABYLON.Color3(0.9, 0.9, 0.2)
};
