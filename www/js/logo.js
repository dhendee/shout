function drawLogo(ctx, width, height) {
  ctx.translate(width - 185, height - 93);
  ctx.scale(2, 2);

  ctx.beginPath();

  ctx.moveTo(3.0, 22.5);
  ctx.bezierCurveTo(3.0, 23.8, 3.8, 24.1, 4.2, 24.1);
  ctx.bezierCurveTo(4.9, 24.1, 5.3, 23.5, 5.3, 23.0);
  ctx.bezierCurveTo(5.3, 22.4, 4.8, 22.2, 3.0, 21.4);
  ctx.bezierCurveTo(2.2, 21.1, 0.2, 20.3, 0.2, 18.1);
  ctx.bezierCurveTo(0.2, 15.7, 2.3, 14.5, 4.2, 14.5);
  ctx.bezierCurveTo(5.9, 14.5, 8.1, 15.3, 8.2, 18.1);
  ctx.lineTo(5.2, 18.1);
  ctx.bezierCurveTo(5.2, 17.7, 5.1, 17.0, 4.2, 17.0);
  ctx.bezierCurveTo(3.6, 17.0, 3.1, 17.3, 3.1, 17.9);
  ctx.bezierCurveTo(3.1, 18.4, 3.4, 18.6, 5.5, 19.5);
  ctx.bezierCurveTo(7.7, 20.5, 8.3, 21.5, 8.3, 22.8);
  ctx.bezierCurveTo(8.3, 24.7, 7.3, 26.6, 4.2, 26.6);
  ctx.bezierCurveTo(1.2, 26.6, -0.1, 24.8, 0.0, 22.5);
  ctx.lineTo(3.0, 22.5);
  ctx.closePath();
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(17.9, 23.0);
  ctx.bezierCurveTo(17.5, 25.0, 15.7, 26.6, 13.4, 26.6);
  ctx.bezierCurveTo(10.7, 26.6, 8.7, 24.6, 8.7, 22.0);
  ctx.bezierCurveTo(8.7, 19.4, 10.7, 17.3, 13.3, 17.3);
  ctx.bezierCurveTo(15.6, 17.3, 17.5, 18.8, 17.9, 21.0);
  ctx.lineTo(15.3, 21.0);
  ctx.bezierCurveTo(15.0, 20.4, 14.5, 19.8, 13.4, 19.8);
  ctx.bezierCurveTo(12.8, 19.7, 12.3, 20.0, 11.9, 20.4);
  ctx.bezierCurveTo(11.5, 20.8, 11.3, 21.3, 11.3, 22.0);
  ctx.bezierCurveTo(11.3, 23.2, 12.2, 24.2, 13.4, 24.2);
  ctx.bezierCurveTo(14.5, 24.2, 15.0, 23.6, 15.3, 23.0);
  ctx.lineTo(17.9, 23.0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(18.7, 14.7);
  ctx.lineTo(21.3, 14.7);
  ctx.lineTo(21.3, 17.3);
  ctx.lineTo(21.3, 18.4);
  ctx.bezierCurveTo(21.8, 17.6, 22.6, 17.3, 23.6, 17.3);
  ctx.bezierCurveTo(24.9, 17.3, 25.7, 17.8, 26.2, 18.6);
  ctx.bezierCurveTo(26.6, 19.3, 26.8, 20.4, 26.8, 21.5);
  ctx.lineTo(26.8, 26.3);
  ctx.lineTo(24.2, 26.3);
  ctx.lineTo(24.2, 21.6);
  ctx.bezierCurveTo(24.2, 21.1, 24.1, 20.7, 23.9, 20.3);
  ctx.bezierCurveTo(23.7, 20.0, 23.3, 19.8, 22.8, 19.8);
  ctx.bezierCurveTo(22.0, 19.8, 21.7, 20.1, 21.5, 20.5);
  ctx.bezierCurveTo(21.3, 20.9, 21.3, 21.3, 21.3, 21.5);
  ctx.lineTo(21.3, 26.3);
  ctx.lineTo(18.7, 26.3);
  ctx.lineTo(18.7, 14.7);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(27.5, 22.0);
  ctx.bezierCurveTo(27.5, 19.8, 29.1, 17.3, 32.2, 17.3);
  ctx.bezierCurveTo(35.4, 17.3, 36.9, 19.8, 36.9, 22.0);
  ctx.bezierCurveTo(36.9, 24.1, 35.4, 26.6, 32.2, 26.6);
  ctx.bezierCurveTo(29.1, 26.6, 27.5, 24.1, 27.5, 22.0);
  ctx.lineTo(27.5, 22.0);
  ctx.closePath();

  ctx.moveTo(30.2, 22.0);
  ctx.bezierCurveTo(30.2, 23.2, 31.1, 24.2, 32.2, 24.2);
  ctx.bezierCurveTo(33.4, 24.2, 34.3, 23.2, 34.3, 22.0);
  ctx.bezierCurveTo(34.3, 20.7, 33.4, 19.8, 32.2, 19.8);
  ctx.bezierCurveTo(31.1, 19.8, 30.2, 20.7, 30.2, 22.0);
  ctx.lineTo(30.2, 22.0);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(36.7, 17.6);
  ctx.lineTo(39.4, 17.6);
  ctx.lineTo(40.7, 23.0);
  ctx.lineTo(42.2, 17.6);
  ctx.lineTo(44.4, 17.6);
  ctx.lineTo(45.9, 23.0);
  ctx.lineTo(47.2, 17.6);
  ctx.lineTo(49.8, 17.6);
  ctx.lineTo(47.2, 26.3);
  ctx.lineTo(44.8, 26.3);
  ctx.lineTo(43.3, 20.7);
  ctx.lineTo(41.8, 26.3);
  ctx.lineTo(39.4, 26.3);
  ctx.lineTo(36.7, 17.6);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();

  ctx.moveTo(51.5, 19.6);
  ctx.lineTo(50.2, 19.6);
  ctx.lineTo(50.2, 17.6);
  ctx.lineTo(51.5, 17.6);
  ctx.lineTo(51.5, 14.7);
  ctx.lineTo(54.1, 14.7);
  ctx.lineTo(54.1, 17.6);
  ctx.lineTo(55.4, 17.6);
  ctx.lineTo(55.4, 19.6);
  ctx.lineTo(54.1, 19.6);
  ctx.lineTo(54.1, 26.3);
  ctx.lineTo(51.5, 26.3);
  ctx.lineTo(51.5, 19.6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
  ctx.beginPath();

  ctx.moveTo(71.9, 6.4);
  ctx.bezierCurveTo(71.8, 5.9, 71.6, 5.4, 71.4, 4.9);
  ctx.bezierCurveTo(71.2, 4.4, 70.9, 4.0, 70.7, 3.5);
  ctx.bezierCurveTo(70.4, 3.1, 70.0, 2.7, 69.7, 2.3);
  ctx.bezierCurveTo(69.3, 2.0, 68.9, 1.7, 68.5, 1.4);
  ctx.bezierCurveTo(68.1, 1.1, 67.6, 0.8, 67.1, 0.6);
  ctx.bezierCurveTo(66.6, 0.4, 66.1, 0.3, 65.6, 0.2);
  ctx.bezierCurveTo(65.1, 0.1, 64.6, 0.0, 64.0, 0.0);
  ctx.bezierCurveTo(63.5, 0.0, 62.9, 0.1, 62.4, 0.2);
  ctx.bezierCurveTo(61.9, 0.3, 61.4, 0.4, 60.9, 0.6);
  ctx.bezierCurveTo(60.4, 0.8, 60.0, 1.1, 59.5, 1.4);
  ctx.bezierCurveTo(59.1, 1.7, 58.7, 2.0, 58.3, 2.3);
  ctx.bezierCurveTo(58.0, 2.7, 57.6, 3.1, 57.4, 3.5);
  ctx.bezierCurveTo(57.1, 4.0, 56.8, 4.4, 56.6, 4.9);
  ctx.bezierCurveTo(56.4, 5.4, 56.3, 5.9, 56.2, 6.4);
  ctx.bezierCurveTo(56.0, 6.9, 56.0, 7.5, 56.0, 8.0);
  ctx.bezierCurveTo(56.0, 8.6, 56.0, 9.1, 56.2, 9.6);
  ctx.bezierCurveTo(56.3, 10.2, 56.4, 10.7, 56.6, 11.1);
  ctx.bezierCurveTo(56.8, 11.6, 57.1, 12.1, 57.4, 12.5);
  ctx.lineTo(56.0, 16.0);
  ctx.lineTo(59.5, 14.7);
  ctx.bezierCurveTo(60.0, 15.0, 60.4, 15.2, 60.9, 15.4);
  ctx.bezierCurveTo(61.4, 15.6, 61.9, 15.8, 62.4, 15.9);
  ctx.bezierCurveTo(62.9, 16.0, 63.5, 16.0, 64.0, 16.0);
  ctx.bezierCurveTo(64.6, 16.0, 65.1, 16.0, 65.6, 15.9);
  ctx.bezierCurveTo(66.1, 15.8, 66.6, 15.6, 67.1, 15.4);
  ctx.bezierCurveTo(67.6, 15.2, 68.1, 15.0, 68.5, 14.7);
  ctx.bezierCurveTo(68.9, 14.4, 69.3, 14.1, 69.7, 13.7);
  ctx.bezierCurveTo(70.0, 13.3, 70.4, 12.9, 70.7, 12.5);
  ctx.bezierCurveTo(70.9, 12.1, 71.2, 11.6, 71.4, 11.1);
  ctx.bezierCurveTo(71.6, 10.7, 71.8, 10.2, 71.9, 9.6);
  ctx.bezierCurveTo(72.0, 9.1, 72.0, 8.6, 72.0, 8.0);
  ctx.bezierCurveTo(72.0, 7.5, 72.0, 6.9, 71.9, 6.4);
  ctx.closePath();

  ctx.moveTo(65.4, 14.3);
  ctx.lineTo(62.6, 14.3);
  ctx.lineTo(62.6, 11.4);
  ctx.lineTo(65.4, 11.4);
  ctx.lineTo(65.4, 14.3);
  ctx.closePath();

  ctx.moveTo(65.4, 10.2);
  ctx.lineTo(62.6, 10.2);
  ctx.lineTo(62.6, 2.2);
  ctx.lineTo(65.4, 2.2);
  ctx.lineTo(65.4, 10.2);
  ctx.closePath();
  ctx.fillStyle = "rgb(255, 255, 255)";
  ctx.fill();
  ctx.restore();
}