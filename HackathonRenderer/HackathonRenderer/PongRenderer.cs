using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace HackathonRenderer
{
    internal class PongRenderer : Renderer
    {
        private static readonly Brush PlayerColor = new SolidBrush(Color.White);
        private static readonly Brush BallColor = new SolidBrush(Color.White);
        private static readonly Font TextFont = new Font("Arial", 16);
        private static readonly Brush TextColor = new SolidBrush(Color.White);
        private readonly StringFormat TextFormat;
        private static readonly Font NameFont = new Font("Arial", 6);
        private readonly StringFormat LeftNameFormat;
        private readonly StringFormat RightNameFormat;

        private readonly int imageWidth;
        private readonly int imageHeight;

        private readonly Pen MiddleLinePen;

        public PongRenderer(int imageWidth, int imageHeight)
        {
            this.imageWidth = imageWidth;
            this.imageHeight = imageHeight;
            TextFormat = new StringFormat();
            TextFormat.Alignment = StringAlignment.Center;

            LeftNameFormat = new StringFormat();
            LeftNameFormat.Alignment = StringAlignment.Near;

            RightNameFormat = new StringFormat();
            RightNameFormat.Alignment = StringAlignment.Far;

            float[] dashValues = { 5, 4 };
            MiddleLinePen = new Pen(Color.Gray, 3);
            MiddleLinePen.DashPattern = dashValues;
        }

        public Bitmap RendererState(string serializedState)
        {
            var state = Deserialized(serializedState);

            var bmp = new Bitmap(imageWidth, imageHeight, PixelFormat.Format24bppRgb);
            var g = Graphics.FromImage(bmp);

            if(state.status == "RUNNING")
            {
                RenderMidGame(g, state);
            }
            else
            {
                RenderWin(g, state);
            }

            return bmp;
        }

        private PongState Deserialized(string state)
        {
            return JsonConvert.DeserializeObject<PongState>(state);
        }

        private void RenderMidGame(Graphics g, PongState state)
        {
            g.DrawLine(MiddleLinePen, imageWidth / 2, 0, imageWidth / 2, imageHeight);

            RenderPlayer(g, 0, state.screenHeight - state.playerLeft.y - state.playerHeight, state.playerWidth, state.playerHeight, state.screenWidth, state.screenHeight);
            RenderPlayer(g, state.screenWidth - state.playerWidth, state.screenHeight - state.playerHeight - state.playerRight.y, state.playerWidth, state.playerHeight, state.screenWidth, state.screenHeight);
            RenderBall(g, state);

            g.DrawString(state.playerLeft.name, TextFont, TextColor, 0, 0, LeftNameFormat);
            g.DrawString(state.playerRight.name, TextFont, TextColor, imageWidth, 0, RightNameFormat);
        }

        private void RenderWin(Graphics g, PongState state)
        {
            var leftWon = state.status.Contains("LEFT");
            g.DrawString((leftWon ? state.playerLeft.name : state.playerRight.name) + " WON!", TextFont, TextColor, (int)(0.5 * imageWidth), (int)(0.5 * imageHeight), TextFormat);
        }

        private void RenderPlayer(Graphics g, double x, double y, double width, double height, double screenWdith, double screenHeight)
        {
            g.FillRectangle(
                PlayerColor,
                (int)Scaled(x, screenWdith, imageWidth),
                (int)Scaled(y, screenHeight, imageHeight),
                (int)Scaled(width, screenWdith, imageWidth),
                (int)Scaled(height, screenHeight, imageHeight)
            );
        }

        private void RenderBall(Graphics g, PongState state)
        {
            var r = state.ballRadius;
            g.FillEllipse(
                BallColor,
                (int)Scaled(state.ball.x - r, state.screenWidth, imageWidth),
                (int)Scaled(state.screenHeight - state.ball.y - r, state.screenHeight, imageHeight),
                (int)Scaled(2.0 * r, state.screenWidth, imageWidth),
                (int)Scaled(2.0 * r, state.screenHeight, imageHeight)
            );
        }

        private double Scaled(double x, double original, double final)
        {
            return x * final / original;
        }
    }
}
