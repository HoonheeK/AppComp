import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveStream } from '@nivo/stream';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveCalendar } from "@nivo/calendar";
import { subDays, format } from "date-fns";
// ResponsiveCalendar와 ResponsiveScatterPlot import는 컴파일 오류로 인해 제거되었습니다.
// import { ResponsiveCalendar } from '@nivo/calendar';
// import { ResponsiveScatterPlot } from '@nivo/scatterplot';

// 샘플 데이터 정의
const barData = [
    {
        "country": "AD",
        "hot dog": 182, "hot dogColor": "hsl(104, 70%, 50%)",
        "burger": 154, "burgerColor": "hsl(162, 70%, 50%)",
        "sandwich": 150, "sandwichColor": "hsl(291, 70%, 50%)",
        "kebab": 140, "kebabColor": "hsl(220, 70%, 50%)",
        "fries": 130, "friesColor": "hsl(340, 70%, 50%)",
        "donut": 120, "donutColor": "hsl(30, 70%, 50%)"
    },
    {
        "country": "AE",
        "hot dog": 170, "hot dogColor": "hsl(10, 70%, 50%)",
        "burger": 160, "burgerColor": "hsl(200, 70%, 50%)",
        "sandwich": 145, "sandwichColor": "hsl(180, 70%, 50%)",
        "kebab": 135, "kebabColor": "hsl(250, 70%, 50%)",
        "fries": 125, "friesColor": "hsl(300, 70%, 50%)",
        "donut": 115, "donutColor": "hsl(50, 70%, 50%)"
    },
    {
        "country": "AF",
        "hot dog": 160, "hot dogColor": "hsl(120, 70%, 50%)",
        "burger": 150, "burgerColor": "hsl(220, 70%, 50%)",
        "sandwich": 130, "sandwichColor": "hsl(300, 70%, 50%)",
        "kebab": 120, "kebabColor": "hsl(10, 70%, 50%)",
        "fries": 110, "friesColor": "hsl(70, 70%, 50%)",
        "donut": 100, "donutColor": "hsl(190, 70%, 50%)"
    },
];

const lineData = [
    {
        id: 'japan',
        data: [
            { x: '2023-01-01', y: 10 },
            { x: '2023-02-01', y: 20 },
            { x: '2023-03-01', y: 15 },
            { x: '2023-04-01', y: 25 },
            { x: '2023-05-01', y: 22 },
            { x: '2023-06-01', y: 30 },
        ],
    },
    {
        id: 'france',
        data: [
            { x: '2023-01-01', y: 15 },
            { x: '2023-02-01', y: 12 },
            { x: '2023-03-01', y: 20 },
            { x: '2023-04-01', y: 18 },
            { x: '2023-05-01', y: 25 },
            { x: '2023-06-01', y: 28 },
        ],
    },
];

const pieData = [
    { id: 'react', value: 40, label: 'React' },
    { id: 'angular', value: 25, label: 'Angular' },
    { id: 'vue', value: 35, label: 'Vue' },
];

// HeatMap 데이터는 아래와 같이 유지
const heatMapData = [
    { id: 'USA', Jan: 10, Feb: 20, Mar: 30, Apr: 40, May: 50 },
    { id: 'Canada', Jan: 15, Feb: 25, Mar: 35, Apr: 45, May: 55 },
    { id: 'Mexico', Jan: 5, Feb: 10, Mar: 15, Apr: 20, May: 25 },
];

const streamData = [
    {
        "Raoul": 10,
        "Josiane": 12,
        "Marcel": 8,
        "René": 15,
        "Paul": 13,
        "Jacques": 16,
    },
    {
        "Raoul": 15,
        "Josiane": 10,
        "Marcel": 12,
        "René": 18,
        "Paul": 14,
        "Jacques": 17,
    },
    {
        "Raoul": 8,
        "Josiane": 18,
        "Marcel": 10,
        "René": 11,
        "Paul": 19,
        "Jacques": 9,
    },
    {
        "Raoul": 12,
        "Josiane": 14,
        "Marcel": 16,
        "René": 9,
        "Paul": 10,
        "Jacques": 11,
    },
];

// Bump Data - 컴파일 오류로 인해 제거
// const bumpData = [
//   {
//     id: 'Serie 1',
//     data: [
//       { x: 2000, y: 10 },
//       { x: 2001, y: 12 },
//       { x: 2002, y: 15 },
//       { x: 2003, y: 13 },
//       { x: 2004, y: 16 },
//     ],
//   },
//   {
//     id: 'Serie 2',
//     data: [
//       { x: 2000, y: 15 },
//       { x: 2001, y: 10 },
//       { x: 2002, y: 12 },
//       { x: 2003, y: 18 },
//       { x: 2004, y: 14 },
//     ],
//   },
//   {
//     id: 'Serie 3',
//     data: [
//       { x: 2000, y: 8 },
//       { x: 2001, y: 18 },
//       { x: 2002, y: 10 },
//       { x: 2003, y: 11 },
//       { x: 2004, y: 19 },
//     ],
//   },
// ];

const radarData = [
    {
        "taste": "fruity",
        "chardonay": 80,
        "carmenere": 90,
        "syrah": 70,
        "merlot": 60,
        "pinot noir": 50
    },
    {
        "taste": "bitter",
        "chardonay": 70,
        "carmenere": 60,
        "syrah": 80,
        "merlot": 90,
        "pinot noir": 75
    },
    {
        "taste": "heavy",
        "chardonay": 60,
        "carmenere": 70,
        "syrah": 90,
        "merlot": 80,
        "pinot noir": 85
    },
    {
        "taste": "strong",
        "chardonay": 90,
        "carmenere": 80,
        "syrah": 60,
        "merlot": 70,
        "pinot noir": 95
    }
];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];

const heatMapSeries = heatMapData.map(row => ({
    id: row.id,
    data: months.map(month => ({
        x: month,
        y: row[month as keyof typeof row] as number,
    })),
}));

const generateFakeData = (from: Date, days: number): { day: string; value: number }[] => {
    return Array.from({ length: days }, (_, i) => {
        const date = subDays(from, days - i - 1);
        return {
            day: format(date, "yyyy-MM-dd"),
            value: Math.floor(Math.random() * 100)
        };
    });
};

const today = new Date();
const calendarData = generateFakeData(today, 365);
// const [calendarData] = useState(data);


const MyHeatMap = () => (
    <div className="h-96 w-full">
        <ResponsiveHeatMap
            data={heatMapSeries}
            margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
            forceSquare={true}
            axisTop={{
                tickSize: 5, tickPadding: 5, tickRotation: -90,
                legend: '월', legendOffset: -36, truncateTickAt: 0
            }}
            axisRight={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '국가', legendOffset: 40, truncateTickAt: 0
            }}
            axisBottom={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '국가', legendOffset: 36, truncateTickAt: 0
            }}
            axisLeft={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '월', legendOffset: -40, truncateTickAt: 0
            }}
            colors={{
                type: 'diverging',
                scheme: 'red_yellow_blue',
                divergeAt: 0.5,
                minValue: 0,
                maxValue: 100
            }}
            emptyColor="#555555"
            labelTextColor={{
                from: 'color',
                modifiers: [
                    ['darker', 1.8]
                ]
            }}
            legends={[
                {
                    anchor: 'bottom',
                    translateX: 0,
                    translateY: 30,
                    direction: 'row',
                }
            ]}
        />
    </div>
);

const MyPieChart = () => (
    <div className="h-96 w-full">
        <ResponsivePie
            data={pieData}
            margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
            innerRadius={0.5}
            padAngle={0.7}
            cornerRadius={3}
            activeOuterRadiusOffset={8}
            colors={{ scheme: 'pastel1' }}
            borderWidth={1}
            borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
            arcLinkLabelsSkipAngle={10}
            arcLinkLabelsTextColor="#333333"
            arcLinkLabelsThickness={2}
            arcLinkLabelsColor={{ from: 'color' }}
            arcLabelsSkipAngle={10}
            arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
            legends={[
                {
                    anchor: 'bottom', direction: 'row', justify: false,
                    translateX: 0, translateY: 56, itemsSpacing: 0,
                    itemWidth: 100, itemHeight: 18, itemTextColor: '#999',
                    itemDirection: 'left-to-right', itemOpacity: 1, symbolSize: 18,
                    symbolShape: 'circle', effects: [{ on: 'hover', style: { itemTextColor: '#000' } }]
                }
            ]}
        />
    </div>
);


// 각 차트 컴포넌트
const MyBarChart = () => (
    <div className="h-96 w-full">
        <ResponsiveBar
            data={barData}
            keys={['hot dog', 'burger', 'sandwich', 'kebab', 'fries', 'donut']}
            indexBy="country"
            margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={{ scheme: 'nivo' }}
            borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '국가', legendPosition: 'middle', legendOffset: 32,
            }}
            axisLeft={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '값', legendPosition: 'middle', legendOffset: -40,
            }}
            enableLabel={false}
            legends={[
                {
                    dataFrom: 'keys', anchor: 'bottom-right', direction: 'column',
                    justify: false, translateX: 120, translateY: 0, itemsSpacing: 2,
                    itemWidth: 100, itemHeight: 20, itemDirection: 'left-to-right',
                    itemOpacity: 0.85, symbolSize: 20,
                    effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
                }
            ]}
            role="application"
            ariaLabel="Nivo 막대 차트"
        />
    </div>
);

const MyLineChart = () => (
    <div className="h-96 w-full">
        <ResponsiveLine
            data={lineData}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            xScale={{ type: 'point' }}
            yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
            yFormat=" >-.2f"
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '날짜', legendOffset: 36, legendPosition: 'middle',
            }}
            axisLeft={{
                tickSize: 5, tickPadding: 5, tickRotation: 0,
                legend: '값', legendOffset: -40, legendPosition: 'middle',
            }}
            pointSize={10}
            pointColor={{ theme: 'background' }}
            pointBorderWidth={2}
            pointBorderColor={{ from: 'serieColor' }}
            pointLabelYOffset={-12}
            useMesh={true}
            legends={[
                {
                    anchor: 'bottom-right', direction: 'column', justify: false,
                    translateX: 100, translateY: 0, itemsSpacing: 0,
                    itemDirection: 'left-to-right', itemWidth: 80, itemHeight: 20,
                    itemOpacity: 0.75, symbolSize: 12, symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [{ on: 'hover', style: { itemOpacity: 1 } }]
                }
            ]}
            role="application"
            ariaLabel="Nivo 라인 차트"
        />
    </div>
);

const MyStreamChart = () => (
    <div className="h-96 w-full">
        <ResponsiveStream
            data={streamData}
            keys={['Raoul', 'Josiane', 'Marcel', 'René', 'Paul', 'Jacques']}
            margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: '시간',
                legendOffset: 36,
                legendPosition: 'middle'
            }}
            axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: '값',
                legendOffset: -40,
                legendPosition: 'middle'
            }}
            enableGridX={true}
            enableGridY={false}
            offsetType="silhouette"
            colors={{ scheme: 'nivo' }}
            fillOpacity={0.85}
            borderColor={{ theme: 'background' }}
            dotSize={8}
            dotColor={{ from: 'color' }}
            dotBorderWidth={2}
            dotBorderColor={{ from: 'serieColor' }}
            legends={[
                {
                    anchor: 'bottom-right',
                    direction: 'column',
                    translateX: 100,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: '#999999',
                    symbolSize: 12,
                    symbolShape: 'circle',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemTextColor: '#000000'
                            }
                        }
                    ]
                }
            ]}
            role="application"
            ariaLabel="Nivo Stream 차트"
        />
    </div>
);

// Bump Chart 컴포넌트 - 컴파일 오류로 인해 제거
// const MyBumpChart = () => (
//   <div className="h-96 w-full">
//     <ResponsiveBump
//       data={bumpData}
//       margin={{ top: 40, right: 100, bottom: 40, left: 100 }}
//       colors={{ scheme: 'nivo' }}
//       lineWidth={3}
//       activeLineWidth={6}
//       inactiveLineWidth={3}
//       activeOpacity={1}
//       inactiveOpacity={0.15}
//       pointSize={10}
//       activePointSize={16}
//       inactivePointSize={0}
//       pointColor={{ theme: 'background' }}
//       pointBorderWidth={3}
//       activePointBorderWidth={3}
//       inactivePointBorderWidth={3}
//       pointBorderColor={{ from: 'serieColor' }}
//       axisTop={{
//         tickSize: 5,
//         tickPadding: 5,
//         tickRotation: 0,
//         legend: '',
//         legendPosition: 'middle',
//         legendOffset: -36
//       }}
//       axisBottom={{
//         tickSize: 5,
//         tickPadding: 5,
//         tickRotation: 0,
//         legend: '',
//         legendPosition: 'middle',
//         legendOffset: 32
//       }}
//       axisLeft={{
//         tickSize: 5,
//         tickPadding: 5,
//         tickRotation: 0,
//         legend: '랭크',
//         legendPosition: 'middle',
//         legendOffset: -40
//       }}
//       role="application"
//       ariaLabel="Nivo Bump 차트"
//     />
//   </div>
// );

const MyRadarChart = () => (
    <div className="h-96 w-full">
        <ResponsiveRadar
            data={radarData}
            keys={['chardonay', 'carmenere', 'syrah', 'merlot', 'pinot noir']}
            indexBy="taste"
            margin={{ top: 70, right: 80, bottom: 40, left: 80 }}
            borderColor={{ from: 'color' }}
            gridLevels={5}
            gridShape="circular"
            dotSize={8}
            dotColor={{ theme: 'background' }}
            dotBorderWidth={2}
            colors={{ scheme: 'nivo' }}
            blendMode="multiply"
            motionConfig="wobbly"
            legends={[
                {
                    anchor: 'top-left',
                    direction: 'column',
                    translateX: -50,
                    translateY: -40,
                    itemWidth: 80,
                    itemHeight: 20,
                    itemTextColor: '#999',
                    symbolSize: 12,
                    symbolShape: 'circle',
                    effects: [
                        {
                            on: 'hover',
                            style: {
                                itemTextColor: '#000'
                            }
                        }
                    ]
                }
            ]}
            role="application"
            ariaLabel="Nivo Radar 차트"
        />
    </div>
);

const MyCalendarChart = () => (
    <div style={{ height: 350 }}>
        <h2>Nivo Calendar Demo</h2>
        <ResponsiveCalendar
            data={calendarData}
            from={format(subDays(today, 364), "yyyy-MM-dd")}
            to={format(today, "yyyy-MM-dd")}
            emptyColor="#eeeeee"
            colors={["#d6e685", "#8cc665", "#44a340", "#1e6823"]}
            margin={{ top: 40, right: 40, bottom: 40, left: 40 }}
            yearSpacing={40}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
            legends={[
                {
                    anchor: "bottom-right",
                    direction: "row",
                    translateY: 36,
                    itemCount: 4,
                    itemWidth: 42,
                    itemHeight: 36,
                    itemsSpacing: 14,
                    itemDirection: "right-to-left"
                }
            ]}
        />
    </div>
);

const ChartComp = () => {
    // 컴파일 오류가 발생한 차트 유형을 초기 탭에서 제거합니다.
    const [activeTab, setActiveTab] = React.useState('Bar');

    const renderChart = () => {
        switch (activeTab) {
            case 'Bar':
                return <MyBarChart />;
            case 'Line':
                return <MyLineChart />;
            case 'Pie':
                return <MyPieChart />;
            case 'HeatMap':
                return <MyHeatMap />;
            case 'Stream':
                return <MyStreamChart />;
            // case 'Bump':
            //   return <MyBumpChart />;
            case 'Radar':
                return <MyRadarChart />;
            case 'Calendar':
                return <MyCalendarChart />;                
            default:
                return <MyBarChart />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 font-sans">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-6xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Nivo 다양한 차트 데모</h1>

                {/* 탭 네비게이션 */}
                <div className="flex justify-center mb-6 flex-wrap gap-2">
                    {/* 컴파일 오류가 발생한 차트 유형 버튼을 제거합니다. */}
                    {['Bar', 'Line', 'Pie', 'HeatMap', 'Stream', 'Radar', 'Calendar'].map((chartType) => (
                        <button
                            key={chartType}
                            className={`px-4 py-2 rounded-md font-medium transition-colors duration-200
                ${activeTab === chartType ? 'bg-blue-600 text-red-500 shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-blue-200'}`}
                            onClick={() => setActiveTab(chartType)}
                        >
                            {chartType} 차트
                        </button>
                    ))}
                </div>

                {/* 차트 렌더링 영역 */}
                <div className="w-full">
                    {renderChart()}
                </div>
            </div>
        </div>
    );
};

export default ChartComp;