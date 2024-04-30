import {
  closestCorners,
  useSensor,
  useSensors,
  MouseSensor,
  TouchSensor,
  Modifier,
  DndContext,
  KeyboardSensor,
} from '@dnd-kit/core';
import { snapCenterToCursor, restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { getEventCoordinates } from '@dnd-kit/utilities';

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
    start: [],
    cancel: [],
    end: [],
  },
};

export const useDndContextProps = () => {
  const sensors = useSensors(
    useSensor(MouseSensor, mouseSensorOptions),
    useSensor(TouchSensor, touchSensorOptions),
    useSensor(KeyboardSensor, keyboardSensorOptions)
    // useSensor(CustomKeyboardSensor, keyboardSensor)
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
