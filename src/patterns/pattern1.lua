local indexes = {}

local colors = {
    { 255, 0,   0 },   -- Red
    { 255, 165, 0 },   -- Orange
    { 255, 255, 0 },   -- Yellow
    { 0,   255, 0 },   -- Green
    { 0,   255, 255 }, -- Cyan
    { 0,   0,   255 }, -- Blue
    { 128, 0,   128 }, -- Purple
    { 255, 192, 203 }  -- Pink
}

function isInRing(x, y, centerX, centerY, innerRadius, outerRadius)
    local adjustedCenterX = centerX + 1
    local adjustedCenterY = centerY + 1

    local distance = math.sqrt((x - adjustedCenterX) ^ 2 + (y - adjustedCenterY) ^ 2)
    return distance >= innerRadius and distance <= outerRadius
end

local sel = 1

for ring = 0, 22, 2 do
    for i = 1, 33, 1 do
        for j = 1, 33, 1 do
            if isInRing(i, j, 16, 16, ring, ring + 2) then
                table.insert(indexes, {
                    x = i,
                    y = j,
                    currentIndex = sel,
                    nextIndex = sel + 1,
                    progress = 0
                })
            end
        end
    end
    
    sel = sel + 1
    if sel >= #colors then
        sel = 1
        if sel >= #colors then
          sel = 1
        end
    end
end


function launchColor(x, y, r, g, b)
    setColorInLayer(x, y, rgbToHex(r, g, b), 1)
end

local function interpolateColor(startColor, endColor, progress)
    local r = startColor[1] + (endColor[1] - startColor[1]) * progress
    local g = startColor[2] + (endColor[2] - startColor[2]) * progress
    local b = startColor[3] + (endColor[3] - startColor[3]) * progress
    return r, g, b
end

updateFunc(async(function()
    while true do
        for _, tile in pairs(indexes) do
            local currentColor = colors[tile.currentIndex]
            local nextColor = colors[tile.nextIndex]
            local r, g, b = interpolateColor(currentColor, nextColor, tile.progress)
            launchColor(tile.x, tile.y, r, g, b)
        end


        sleep(1):await()

        for _, tile in pairs(indexes) do
            tile.progress = tile.progress + 0.5
            if tile.progress >= 1 then
                tile.progress = 0
                tile.currentIndex = tile.nextIndex
                tile.nextIndex = tile.nextIndex % #colors + 1
            end
        end
    end
end))
