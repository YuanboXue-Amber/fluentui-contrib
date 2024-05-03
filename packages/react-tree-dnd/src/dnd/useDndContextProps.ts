import {
  closestCorners,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  KeyboardCode,
  KeyboardSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

const mouseSensorOptions = {
  activationConstraint: {
    distance: 5,
  },
};
const touchSensorOptions = {
  activationConstraint: {
    delay: 200,
    tolerance: 5,
  },
};
const keyboardSensorOptions = {
  keyboardCodes: {
    start: ['AltLeft', 'AltRight'],
    cancel: [KeyboardCode.Esc],
    end: [KeyboardCode.Space, KeyboardCode.Enter],
  },
  coordinateGetter: sortableKeyboardCoordinates,
};

export const useDndContextProps = () => {
  const sensors = useSensors(
    useSensor(MouseSensor, mouseSensorOptions),
    useSensor(TouchSensor, touchSensorOptions),
    useSensor(KeyboardSensor, keyboardSensorOptions)
  );

  return {
    sensors,
    collisionDetection: closestCorners,
    modifiers: [
      snapCenterToCursor, // make sure draggable follows the cursor when tree item collapses on drag start
      restrictToVerticalAxis,
    ],
  };
};
