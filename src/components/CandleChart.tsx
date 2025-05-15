import React, { useEffect, useState, useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register the required chart components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const CandleChart = () => {
    // State for chart data and animation control
    const [data, setData] = useState<any>(null);              // Chart data structure
    const [countdown, setCountdown] = useState<number>(3);    // Initial countdown timer
    const [isRunning, setIsRunning] = useState<boolean>(true);// Controls countdown state
    const [isGeneratingCandles, setIsGeneratingCandles] = useState<boolean>(false); // Controls candle generation
    const [currentCandleIndex, setCurrentCandleIndex] = useState<number>(0); // Current candle being animated
    const [candleData, setCandleData] = useState<any[]>([]);  // Array of all candles

    // Refs for animation tracking
    const animationFrameId = useRef<number | undefined>(undefined);
    const lastUpdateTime = useRef<number>(Date.now());
    const candleStartTime = useRef<number>(0);
    const candleTargetHeight = useRef<number>(0);

    // Constants
    const CANDLE_COUNT = 30;           // Total number of candles
    const CANDLE_DURATION = 5000;      // Duration of each candle animation (5 seconds)
    const BASE_PRICE = 1;              // Starting price (1x)

    /**
     * Creates the data structure required by Chart.js
     * @param candles - Array of candle data
     * @param currentIndex - Index of currently animating candle
     * @param currentHeight - Current height of animating candle
     */
    const createChartData = (candles: any[], currentIndex: number, currentHeight: number = 0) => {
        return {
            labels: Array.from({ length: CANDLE_COUNT }, (_, i) => i.toString()),
            datasets: [{
                data: candles.map((candle, index) => 
                    index === currentIndex ? Math.abs(currentHeight) : (candle?.height || 0)
                ),
                backgroundColor: candles.map((candle, index) => 
                    index === currentIndex 
                        ? (currentHeight >= 0 ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)')
                        : (candle?.color || 'transparent')
                ),
                base: candles.map((candle, index) => BASE_PRICE),
            }]
        };
    };

    /**
     * Handles the animation of a single candle
     */
    const animateCandle = () => {
        if (!isGeneratingCandles) return;
        
        const currentTime = Date.now();
        const elapsedTime = currentTime - candleStartTime.current;
        
        // Check if current candle animation is complete
        if (elapsedTime >= CANDLE_DURATION) {
            handleCandleCompletion();
        } else {
            updateCurrentCandle(elapsedTime);
        }
        
        animationFrameId.current = requestAnimationFrame(animateCandle);
    };

    /**
     * Handles the completion of a candle animation
     */
    const handleCandleCompletion = () => {
        const finalHeight = candleTargetHeight.current;
        const newCandleData = [...candleData];
        
        // Save the completed candle
        newCandleData[currentCandleIndex] = {
            height: finalHeight,
            base: BASE_PRICE,
            color: finalHeight >= 0 ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'
        };
        
        setCandleData(newCandleData);
        
        // Check if we should rug pull
        if (currentCandleIndex >= CANDLE_COUNT - 1) {
            handleRugPull(newCandleData);
            return;
        }
        
        // Start next candle
        startNextCandle();
    };

    /**
     * Updates the current animating candle
     */
    const updateCurrentCandle = (elapsedTime: number) => {
        const progress = elapsedTime / CANDLE_DURATION;
        const targetHeight = candleTargetHeight.current;
        
        // Add noise to make movement more realistic
        const noise = Math.sin(progress * Math.PI * 8) * 0.05;
        const currentHeight = targetHeight * progress + noise;
        
        const newCandleData = [...candleData];
        newCandleData[currentCandleIndex] = {
            height: currentHeight,
            base: BASE_PRICE,
            color: currentHeight >= 0 ? 'rgba(0, 255, 0, 1)' : 'rgba(255, 0, 0, 1)'
        };
        
        setCandleData(newCandleData);
        setData(createChartData(newCandleData, currentCandleIndex, currentHeight));
    };

    /**
     * Handles the rug pull animation
     */
    const handleRugPull = (candleData: any[]) => {
        const rugPullData = [...candleData];
        rugPullData[CANDLE_COUNT - 1] = {
            height: -BASE_PRICE,
            base: BASE_PRICE,
            color: 'rgba(255, 0, 0, 1)'
        };
        
        setCandleData(rugPullData);
        setIsGeneratingCandles(false);
        setTimeout(resetChart, 2000);
    };

    /**
     * Starts the next candle animation
     */
    const startNextCandle = () => {
        setCurrentCandleIndex(prev => prev + 1);
        candleStartTime.current = Date.now();
        candleTargetHeight.current = (Math.random() - 0.5); // Random between -0.5 and 0.5
    };

    /**
     * Resets the chart to initial state
     */
    const resetChart = () => {
        const emptyCandles = Array(CANDLE_COUNT).fill(null).map(() => ({
            height: 0,
            base: BASE_PRICE,
            color: 'transparent'
        }));
        
        setIsGeneratingCandles(false);
        setCurrentCandleIndex(0);
        candleStartTime.current = 0;
        candleTargetHeight.current = (Math.random() - 0.5);
        setCandleData(emptyCandles);
        setData(createChartData(emptyCandles, 0, 0));
        setCountdown(3);
        setIsRunning(true);
    };

    // Initialize chart
    useEffect(() => {
        resetChart();
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, []);

    // Handle countdown
    useEffect(() => {
        if (!isRunning) return;

        const updateCountdown = () => {
            const currentTime = Date.now();
            const deltaTime = (currentTime - lastUpdateTime.current) / 1000;
            lastUpdateTime.current = currentTime;

            setCountdown(prev => {
                const newCountdown = prev - deltaTime;
                if (newCountdown <= 0) {
                    setIsRunning(false);
                    setIsGeneratingCandles(true);
                    return 0;
                }
                return newCountdown;
            });

            animationFrameId.current = requestAnimationFrame(updateCountdown);
        };

        lastUpdateTime.current = Date.now();
        animationFrameId.current = requestAnimationFrame(updateCountdown);

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isRunning]);

    // Start candle generation
    useEffect(() => {
        if (isGeneratingCandles) {
            candleStartTime.current = Date.now();
            candleTargetHeight.current = (Math.random() - 0.5);
            animateCandle();
        }
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [isGeneratingCandles]);

    // Chart configuration
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 0
        },
        scales: {
            y: {
                position: 'left',
                ticks: {
                    callback: (value: number) => `${value.toFixed(1)}x`,
                    color: 'white',
                    font: { size: 14 }
                },
                min: 0,
                max: 2, // Fixed scale 0-2x
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)'
                }
            },
            x: {
                display: false
            }
        },
        plugins: {
            legend: { display: false },
            tooltip: { enabled: false }
        }
    };

    return (
        <div style={{ 
            position: 'relative', 
            height: '400px', 
            width: '100%',
            backgroundColor: '#13141b',
            borderRadius: '8px',
            padding: '20px'
        }}>
            {data && <Bar data={data} options={options as any} />}
            <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '5px 10px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold'
            }}>
                {countdown.toFixed(1)}s
            </div>
        </div>
    );
};

export default CandleChart;