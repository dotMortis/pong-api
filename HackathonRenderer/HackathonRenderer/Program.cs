using HackathonRenderer;

Renderer renderer = new PongRenderer(320, 240);

var stateListener = new StateListener("ws://localhost:8090", renderer);

var frontendServer = new FrontendServer("http://+:8081/");
frontendServer.RendereredState = renderer.RendererState(@"
{
    ""screenWidth"": 1000,
    ""screenHeight"": 600,
    ""ballRadius"": 20,

    ""ball"": {
        ""x"": 500,
        ""y"": 300,
    },

    ""playerLeft"": {
        ""y"": 0,
    },

    ""playerRight"": {
        ""y"": 500
    },

    ""playerHeight"": 100,

    ""playerWidth"": 30,
    ""status"": ""RUNNING""
}
");

stateListener.StateRendered += (sender, e) => frontendServer.RendereredState = e.Image;

stateListener.Run();
await frontendServer.Start();