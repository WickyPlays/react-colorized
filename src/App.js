import './App.css';
import { useEffect, useState } from 'react';
import Timeout from 'smart-timeout'
import { update } from "js-coroutines";
import LuaCodeEditor from './components/LuaCodeEditor';
import { rgbToHex } from './utils/ColorUtil';
const { LuaFactory } = require('wasmoon')

function App() {

	let size = 25
	let width = 33
	let height = 33
	let defaultColor = '#353535'
	let [tiles, setTiles] = useState([])
	const [number, setNumber] = useState(-1);
	const [color, setColor] = useState(defaultColor)
	const [tasks, setTasks] = useState([])
	const [error, setError] = useState(null)
	const [firstRun, setFirstRun] = useState(false)
	let taskID = 0

	const sleep = ms => new Promise((resolve, reject) => {
		tasks.push(`task-${taskID}`)
		Timeout.instantiate(`task-${taskID}`, function() {
			resolve()
			clearSleepName(`task-${taskID}`)
		}, ms)
		taskID++
	})

	const clearSleepName = (named) => {
		Timeout.pause(named)
	}

	const clearSleep = () => {
		for (let i = 0; i < tasks.length; i++) {
			Timeout.pause(tasks[i])
		}
	};

	const setupLayer = async () => {
		tiles.splice(0, tiles.length);
		for (let i = 1; i <= width; i++) {
			for (let j = 1; j <= height; j++) {
				tiles.push({
					x: i,
					y: j,
					layers: [{
						layer: -1,
						color: defaultColor
					}],
					props: {}
				})
			}
		}

		setTiles([...tiles])
	}

	const getColorOfHighestLayer = (tile) => {
		const highestLayer = tile.layers.reduce((maxLayer, currentLayer) => {
			return currentLayer.layer > maxLayer.layer ? currentLayer : maxLayer;
		}, { layer: -1, color: '#353535' });

		return highestLayer.color;
	};

	const getColorOfLayer = (targetTile, targetLayer) => {

		if (targetTile) {
			const targetLayerObj = targetTile.layers.find(layer => layer.layer === targetLayer);
			return targetLayerObj ? targetLayerObj.color : defaultColor;
		}

		return defaultColor;
	};

	const setColorInLayer = (x, y, color, layerIndex) => {
		if (x > width || y > height) return;

		const tileIndex = tiles.findIndex(tile => tile.x === x && tile.y === y);

		if (tileIndex !== -1) {
			const { layers = [] } = tiles[tileIndex];

			if (layerIndex === null) {
				if (color === null) {
					tiles[tileIndex].layers = layers.filter(layer => layer.layer === -1);
				} else {
					layers.forEach(layer => {
						if (layer.layer !== -1) {
							layer.color = color;
						}
					});
				}
			} else {
				const layerExistsIndex = layers.findIndex(layer => layer.layer === layerIndex);

				if (color === null) {
					if (layerExistsIndex !== -1) {
						layers.splice(layerExistsIndex, 1);
					}
				} else {
					layerExistsIndex !== -1
						? layers[layerExistsIndex].color = color
						: layers.push({ layer: layerIndex, color });
				}
			}

			tiles[tileIndex].layers = layers;
		} else {
			if (color !== null) {
				tiles.push({ x, y, layers: [{ layer: layerIndex, color }] });
			}
		}

		//setTiles([...tiles]);
	};

	const deleteObjectWithLayer = () => {
		if (number < 0) return
		deleteLayer(number)
	};

	const deleteLayer = async (layerIndex) => {
		for (let i = 1; i <= width; i++) {
			for (let j = 1; j <= height; j++) {
				setColorInLayer(i, j, null, layerIndex)
			}
		}
	};

	const deleteAllLayers = async () => {
		for (let i = 1; i <= width; i++) {
			for (let j = 1; j <= height; j++) {
				setColorInLayer(i, j, null, null)
			}
		}
	}

	const createPromise = (resolve, reject) => {
		return new Promise(resolve, reject)
	}

	const resolvePromise = (callback) => {
		return Promise.resolve(callback)
	}

	function updateTiles() {
		if (firstRun) return
		setFirstRun(true)
		update(function* () {
			while (true) {
				setTiles([...tiles]);
				yield
			}
		})
	}

	function updateFunc(cor) {
		update(function* () {
			cor()
		});
	}

	const runCode = async (luaCode) => {
		updateTiles()
		setError(null)
		clearSleep()
		deleteAllLayers()

		const factory = new LuaFactory()
		const lua = await factory.createEngine()

		const asyncFunc = `
			function async(callback)
				return function(...)
					local co = coroutine.create(callback)
					local safe, result = coroutine.resume(co, ...)

					return createPromise(function(resolve, reject)
						local function step()
							if coroutine.status(co) == "dead" then
								local send = safe and resolve or reject
								return send(result)
							end

							safe, result = coroutine.resume(co)

							if safe and result == resolvePromise(result) then
								result:finally(step)
							else
								step()
							end
						end

						result:finally(step)
					end)
				end
			end`

		try {
			lua.global.set('setColorInLayer', setColorInLayer)
			lua.global.set('deleteLayer', deleteLayer)
			lua.global.set('sleep', sleep)
			lua.global.set('rgbToHex', rgbToHex)
			lua.global.set('updateFunc', updateFunc)
			lua.global.set('createPromise', createPromise)
			lua.global.set('resolvePromise', resolvePromise)
			await lua.doString(asyncFunc + "\n" + luaCode)
		} catch (e) {
			setError(e.toString())
		} finally {
			// lua.global.close()
		}

	}

	useEffect(() => {
		setupLayer()
	}, [])

	return (
		<div>
			<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '0 2vw' }}>
				<div style={{ display: 'grid', gridTemplateColumns: `repeat(33, ${size}px)`, gridTemplateRows: `repeat(33, ${size}px)`, paddingLeft: '25px', paddingTop: '35px' }}>
					{
						tiles.map((tile, index) => (
							<div key={index} style={{ backgroundColor: number > -1 ? getColorOfLayer(tile, number) : getColorOfHighestLayer(tile), border: `2px solid #000` }} onClick={() => {
								setColorInLayer(tile.x, tile.y, color, number)
							}}>

							</div>
						))
					}
				</div>
				<div style={{overflowY: 'scroll'}}>
					<div style={{ paddingTop: 45 }}>
						<p>You are at layer: {number}</p>
						<label htmlFor="numberInput">Layer: </label>
						<input
							type="number"
							id="numberInput"
							value={number}
							onChange={(e) => {
								setNumber(Number(e.target.value));
							}}
						/>
						<button onClick={() => deleteObjectWithLayer()}>Clear this layer</button>
						<button onClick={() => deleteAllLayers()}>Clear all layers</button>
					</div>
					<div>
						<label htmlFor="colorInput">Color: </label>
						<input
							type="color"
							id="colorInput"
							value={color}
							onChange={(e) => {
								setColor(e.target.value)
							}}
						/>
					</div>
					<hr />
					<div>
						<LuaCodeEditor runCode={runCode} clearSleep={clearSleep} />
						<br />

					</div>
					<div>
						{error !== null && (
							<div className='error-box'>
								{error}
							</div>
						)}
					</div>
				</div>

			</div>

		</div>

	);
}

export default App;
