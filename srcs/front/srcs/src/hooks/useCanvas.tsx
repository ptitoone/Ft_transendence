import { useRef, useEffect } from 'react'

const useCanvas = (update: any, draw: any) => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const context = canvasRef.current?.getContext('2d');

	useEffect(() => {
		if (context) {
			update(context);
		}
	}, []);

	useEffect(() => {
		let animationFrameId: number;

		if (context) {
			const render = () => {
				draw(context)
				window.cancelAnimationFrame(animationFrameId);
			};
			render();	
		}
		return () =>  window.cancelAnimationFrame(animationFrameId);
		
	}, [draw, context]);

	return [canvasRef];
}

export default useCanvas; 