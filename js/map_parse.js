
var debug = true;

function db(msg)
{
    if (debug)
    {
        console.log(msg)
    }
}

function ParseMapFile(map_data)
{
    // find all the top-level sections
    var lines = map_data.split('\n');
    //var sections = map_data.match(/\*\(\.(.*)\)/);
    for (var l = 0;l < lines.length;l++)
    {
        var section = lines[l].match(/\*\(\.(.*?)\)/);
        if(section)
        {
            db(section[1]);
        }
    }
    return map_data;
}