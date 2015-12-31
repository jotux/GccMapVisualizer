
var debug = true;

function log(msg)
{
    if (debug)
    {
        console.log(msg)
    }
}

function Section(index,name,children)
{
    this.index = index;
    this.name = name;
    this.children = children;
}

function Item(index,name,address,size)
{
    this.index = index;
    this.name = name;
    this.address = address;
    this.size = size;
}

function ParseMapFile(map_data)
{
    var sections = [];
    var item_height = 0;
    // Create the top-level object
    sections.push(new Section(0,"",[]));
    // Find all the top-level sections
    var lines = map_data.split('\n');
    for (var i = 0;i < lines.length;i++)
    {
        // find a section title
        var _sec = lines[i].match(/\*\(\.(.*?)\)/);
        if(_sec)
        {
            var section_name = _sec[1];
            if (!approvedSection(section_name))
            {
                continue;
            }
            // Push it to the sections
            var index = sections[0].children.length + 1;
            sections[0].children.push(new Section(index,section_name,[]));
            // Find all the item lines until the next section
            var item_lines = []
            while (!isSectionTitle(lines[i + 1]) && !isEnd(lines[i + 1]) && i !== lines.length)
            {
                var address = ReadLineAddress(lines[i]);
                if (address !== -1)
                {
                    item_lines.push(lines[i]);
                }
                i++;
            }
            var sec_index = sections[0].children.length - 1;
            var items = ParseItemLines(item_lines);
            if (items != null)
            {
                for (var j = 0;j < items.length;j++)
                {
                    item_height += parseInt(items[j].size);
                    sections[0].children[sec_index].children.push(items[j]);
                }
            }
        }
    }
    // 12px per line for each item
    item_height *= 6;
    item_height = Math.round(item_height);
    return [item_height,sections[0]];
}

function isSectionTitle(s)
{
    var is_title = /\*\(\.(.*?)\)/.test(s);
    return is_title;
}

function isEnd(s)
{
    return (s.indexOf("OUTPUT") > -1 ? true : false);
}

function ReadLineAddress(s)
{
    var addr = s.match(/0[xX][0-9a-fA-F]+/);
    if (addr !== null)
    {
        var address = parseInt(addr[0]);
        return "0x" + address.toString(16);
    }
    return -1;
}

function ReadLineSize(s)
{
    var n = s.match(/0[xX][0-9a-fA-F]+/g);
    if (n.length > 1)
    {
        return n[1];
    }
    return 0;
}

function ReadLineName(s)
{
    var n = s.match(/0[xX][0-9a-fA-F]+(.*)/);
    if (n !== null)
    {
        return n[1].trim();
    }
    return null;
}

function approvedSection(s)
{
    var approved_names =
    [
        "text*",
        "data*",
        "bss*"
    ];
    for (var i = 0;i < approved_names.length;i++)
    {
        if (approved_names[i] == s)
        {
            return true;
        }
    }
    return false;
}

function ParseItemLines(items)
{
    var ret = [];
    var index = 0; // for soring in d3
    for (var i = 0;i < items.length;i++)
    {
        // Get the first address
        var address = ReadLineAddress(items[i]);
        // Push everyone with the same address into an array
        var _items = [items[i]];
        while(i !== items.length - 1 && address == ReadLineAddress(items[i + 1]))
        {
            _items.push(items[i + 1]);
            i++;
        }
        var _name;
        // If there is only one instance parse the info out to an item
        if (_items.length == 1)
        {
            // Could be a fill
            var fill = ReadFill(_items[0]);
            if (fill !== null)
            {
                // Fix the index
                fill.index = index++;
                ret.push(fill);
                continue;
            }
            // Otherwise strip off the address and stuff it all into an item
            _name = ReadLineName(_items[0]);
        }
        // More than one item
        else
        {
            // The last instance always has the pretty name
            _name = ReadLineName(_items[_items.length - 1]);
        }
        var _item = new Item(index++, _name,
                                      ReadLineAddress(_items[0]),
                                      ReadLineSize(_items[0]));
        ret.push(_item);
    }
    return ret;
}

function ReadFill(s)
{
    var is_fill = /\*fill/.test(s);
    if (is_fill)
    {
        var name = "*fill*";
        var address = ReadLineAddress(s);
        var size = ReadLineSize(s);
        return (new Item(0,name,address,size));
    }
    return null;
}


