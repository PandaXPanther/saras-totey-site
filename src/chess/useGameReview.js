import { useEffect, useRef, useState } from 'react';
import { createEngine } from './engine.js';
import { reviewMove } from './strategy.js';

export function useGameReview(moves, finished) {
  const [data, setData] = useState([]);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const reviewed = useRef(0);

  useEffect(() => {
    if (!finished || reviewed.current >= moves.length) return;
    let active = true;
    let engine;
    async function analyze() {
      try {
        engine = createEngine();
        await engine.ready;
        const history = moves.slice(0, reviewed.current).map((move) => move.lan);
        for (let index = reviewed.current; index < moves.length; index++) {
          const rating = await reviewMove(engine, moves[index], history);
          if (!active) return;
          history.push(moves[index].lan);
          reviewed.current = index + 1;
          setData((rows) => [...rows, rating]);
        }
      } catch {
        if (active) setFailed(true);
      } finally {
        engine?.close();
      }
    }
    void analyze();
    return () => {
      active = false;
      engine?.close();
    };
  }, [finished, moves, attempt]);

  return {
    data, failed, total: moves.length,
    complete: finished && data.length === moves.length,
    retry() {
      setFailed(false);
      setAttempt((count) => count + 1);
    },
  };
}
