using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackathonRenderer
{
    public struct PongState
    {
        public double screenWidth;
        public double screenHeight;
        public Vector2 ball;
        public double ballRadius;
        public PlayerState playerLeft;
        public PlayerState playerRight;
        public double playerWidth;
        public double playerHeight;
        public string status;
    }
}
