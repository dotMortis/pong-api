using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.WebSockets;
using System.Text;
using System.Threading.Tasks;

namespace HackathonRenderer
{
    internal class StateListener
    {
        private const int ReceiveBufferSize = 512;

        private readonly string serverUrl;
        private ClientWebSocket? webSocket;
        private CancellationTokenSource socketCancellation;
        private readonly Renderer renderer;

        public StateListener(string serverUrl, Renderer renderer)
        {
            this.serverUrl = serverUrl;
            webSocket = null;
            socketCancellation = new CancellationTokenSource();
            this.renderer = renderer;
        }

        public async Task Run()
        {
            await OpenSocket();

            await Task.Factory.StartNew(Loop, socketCancellation.Token, TaskCreationOptions.LongRunning, TaskScheduler.Default);
        }

        private async Task OpenSocket()
        {
            if (webSocket != null)
            {
                throw new Exception("WebSocket already connected!");
            }

            webSocket = new ClientWebSocket();
            await webSocket.ConnectAsync(new Uri(serverUrl), socketCancellation.Token);
        }

        private async void Loop()
        {
            if(webSocket == null)
            {
                throw new Exception("WebSocket must be running");
            }

            MemoryStream outputStream;
            WebSocketReceiveResult receiveResult;
            var buffer = new byte[ReceiveBufferSize];
            while (!socketCancellation.Token.IsCancellationRequested)
            {
                try
                {
                    outputStream = new MemoryStream(ReceiveBufferSize);
                    do
                    {
                        receiveResult = await webSocket.ReceiveAsync(buffer, socketCancellation.Token);
                        if (receiveResult.MessageType != WebSocketMessageType.Close)
                            outputStream.Write(buffer, 0, receiveResult.Count);
                    }
                    while (!receiveResult.EndOfMessage);
                    if (receiveResult.MessageType == WebSocketMessageType.Close) break;
                    outputStream.Position = 0;
                    StateReceived(outputStream);
                }
                catch(Exception ex)
                {
                    Console.WriteLine("Fehler, wird schon passen...");
                    Console.WriteLine(ex.Message);
                }
            }
        }

        private void StateReceived(Stream inputStream)
        {
            using var reader = new StreamReader(inputStream);
            var message = reader.ReadToEnd();
            Console.WriteLine("WS: " + message);
            var newImage = renderer.RendererState(message);

            StateRendered?.Invoke(this, new StateRenderedEventArgs(newImage));
        }

        public event EventHandler<StateRenderedEventArgs> StateRendered;
    }
}
