import { DataQuery } from '@grafana/data';
import React, { createContext, PropsWithChildren, useContext, useEffect, useState } from 'react';
import { DragDropContext, OnDragEndResponder, OnDragStartResponder } from 'react-beautiful-dnd';
import { useKeyPress } from 'react-use';
import { Scratchpad } from './components/Scratchpad';

interface RegisterOptions {
  onDragStart?: OnDragStartResponder;
  onDragEnd?: OnDragEndResponder;
  getItem?: (index: number) => any;
  onAddItem?: (index: number, query: DataQuery) => void;
  onRemoveItem?: (index: number) => void;
}
export interface ScratchpadContextType {
  register: (id: string, options: RegisterOptions) => void;
}

export const ScratchpadContext = createContext<ScratchpadContextType | null>(null);

export const ScratchpadConsumer = ScratchpadContext.Consumer;

export const useScratchpad = (id: string, options: RegisterOptions) => {
  const scratchpadContext = useContext(ScratchpadContext);
  scratchpadContext?.register(id, options);
};

const handlerMap = new Map<string, RegisterOptions>();

interface Props {}
export const ScratchpadProvider = ({ children }: PropsWithChildren<Props>) => {
  const [isDragging, setIsDragging] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  function downHandler({ shiftKey }: KeyboardEvent) {
    setShiftPressed(shiftKey);
  }
  // If released key is our target key then set to false
  const upHandler = ({ shiftKey }: KeyboardEvent) => {
    setShiftPressed(shiftKey);
  };
  useEffect(() => {
    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, []);
  const value: ScratchpadContextType = {
    register(id, options) {
      handlerMap.set(id, options);
    },
  };

  const onDragStart: OnDragStartResponder = (s, b) => {
    setIsDragging(true);
    handlerMap.get(s.source.droppableId)?.onDragStart?.(s, b);
  };

  const onDragEnd: OnDragEndResponder = (e, b) => {
    setIsDragging(false);

    handlerMap.get(e.source.droppableId)?.onDragEnd?.(e, b);

    // // We are putting something into the scratchpad
    // if (e.destination?.droppableId === 'scratchpad' && e.source.droppableId !== e.destination?.droppableId) {
    //   console.log('move to scratchpad');
    // }

    // we are moving a query from one area to another
    if (e.destination?.droppableId && e.destination?.droppableId !== e.source.droppableId) {
      const sourceArea = handlerMap.get(e.source.droppableId);
      handlerMap
        .get(e.destination.droppableId)
        ?.onAddItem?.(e.destination?.index, sourceArea?.getItem?.(e.source.index));
      if (!shiftPressed) {
        sourceArea?.onRemoveItem?.(e.source.index);
      }
    }
  };

  return (
    <>
      <ScratchpadContext.Provider value={value}>
        <DragDropContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
          <Scratchpad isDragging={isDragging} />

          {children}
        </DragDropContext>
      </ScratchpadContext.Provider>
    </>
  );
};
