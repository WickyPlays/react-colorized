updateFunc(async(function()
    for i = 1, 33, 1 do
        for j = 1, 33, 1 do
            setColorInLayer(i, j, '#FF0000', 1)
        end
        sleep(10):await()
        deleteLayer(1)
    end
end))
