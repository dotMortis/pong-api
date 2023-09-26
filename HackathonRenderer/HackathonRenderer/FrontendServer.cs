using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Net;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

namespace HackathonRenderer
{
    internal class FrontendServer
    {
        private HttpListener? listener;
        private ImageCodecInfo jpegEncoder;
        private string url;

        public FrontendServer(string url)
        {
            this.url = url;
            listener = null;
            RendereredState = null;
            jpegEncoder = GetEncoder(ImageFormat.Jpeg);
        }

        private ImageCodecInfo GetEncoder(ImageFormat format)
        {
            var codecs = ImageCodecInfo.GetImageDecoders();
            foreach (ImageCodecInfo codec in codecs)
            {
                if (codec.FormatID == format.Guid)
                    return codec;
            }
            throw new Exception("Could not get Encoder for JPEG");
        }

        public Bitmap? RendereredState { get; set; }

        public async Task Start()
        {
            listener = new HttpListener();
            listener.Prefixes.Add(url);
            listener.Start();

            bool running = true;
            while (running)
            {
                await HandleRequest();
            }
        }

        private async Task HandleRequest()
        {
            if (listener == null)
                return;

            try
            {
                var context = await listener.GetContextAsync();
                var response = context.Response;

                response.ContentType = "image/jpeg";

                var encoderParameters = new EncoderParameters(1);
                encoderParameters.Param[0] = new EncoderParameter(System.Drawing.Imaging.Encoder.Quality, 70L);
                using var jpegStream = new MemoryStream();

                if (RendereredState != null)
                {
                    RendereredState.Save(jpegStream, jpegEncoder, encoderParameters);
                    var jpegData = jpegStream.ToArray();
                    Console.WriteLine("Size: " + jpegData.Length);
                    response.ContentLength64 = jpegData.Length;
                    await response.OutputStream.WriteAsync(jpegData, 0, jpegData.Length);
                }
                response.Close();
            }
            catch (Exception ex)
            {
                Console.WriteLine("Fehler, wird schon passen...");
                Console.WriteLine(ex.Message);
            }
        }
    }
}
