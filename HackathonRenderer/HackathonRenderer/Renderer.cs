using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Drawing;

namespace HackathonRenderer
{
    internal interface Renderer
    {
        Bitmap RendererState(string state);
    }
}
