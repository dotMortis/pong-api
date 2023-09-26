using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackathonRenderer
{
    internal class StateRenderedEventArgs : EventArgs
    {
        public StateRenderedEventArgs(Bitmap image)
        {
            Image = image;
        }

        public Bitmap Image { get; }
    }
}
