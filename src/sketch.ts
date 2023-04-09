const [IMG_AMOUNT, BACKEND_PORT] = [1200, 3002];

// Get Div's width & height
const container_dom = <HTMLDivElement>document.getElementById("p5-container");
const canvas_width: number = container_dom.offsetWidth;
const canvas_height: number = container_dom.offsetHeight;

// Constain variable for graphic generation
const [circle_scale, dot_amount] = [5, 8];
const circle_center_xy = [canvas_width / 2, canvas_height * circle_scale * 0.5 + (canvas_height * .4)]
const unit_length = 40;

// Declare Main Canvas
let main_canvas;

// Delete this after connect to osc server
let [progress_value, current_img_id] = [0, 1000];

// Get realtime video progress value
const get_video_progress = (): number => {
  return progress_value;
};


// Get image to show by progress_value
const get_img_num = (): number => {
  // ~~ : Math.round()
  return ~~(progress_value / 77);
};

// Switch DOM backgroundImage by img_id
const switch_img = (img_id: number): void => {
  const img_container = <HTMLDivElement>(
    document.getElementById("img-container")
  );
  fetch(`http://localhost:${BACKEND_PORT}/imginfo/${img_id}`).then((res) => {
    res.json().then((data) => {
      let content: string = '';
      console.log(data);
      for (const [key, value] of Object.entries(data)) {
        content += `${key} -> ${value}<br>`
      }
      document.getElementById('img-info')?.innerHTML = content
    });
  });
  if (img_container)
    img_container.style.backgroundImage = `url('http://localhost:${BACKEND_PORT}/img/${img_id}')`;
};

// const slider = <HTMLInputElement>(document.getElementById('progress-value'));
// slider.oninput = () => {
//   progress_value = parseInt(slider.value);
// }

let current_touch_x: number | null;
const touch_step = 30
container_dom.ontouchmove = e => {
  const touch_x = e.touches[0].clientX;
  if (!current_touch_x) current_touch_x = touch_x
  progress_value -= ~~((touch_x - current_touch_x) * touch_step)
  // if (touch_x < current_touch_x) progress_value += touch_step;
  // else progress_value -= touch_step;
  current_touch_x = touch_x
}

container_dom.ontouchend = e => {
  current_touch_x = null;
}


// P5 Script
const sketch = function(p: p5) {
  function draw_graph(progress_value: number) {
    const circle_center = p.createVector(...circle_center_xy);
    p.noFill();
    p.stroke(90, 255, 70, 250);
    p.circle(circle_center.x, circle_center.y, canvas_height * circle_scale)
    p.strokeWeight(5);


    for (let i = -10; i < dot_amount + 10; i++) {
      const line_length = unit_length;
      const v1 = p.createVector(
        canvas_width * i / dot_amount - (progress_value % 77),
        canvas_height * .35
      );
      const v2 = (circle_center.copy().sub(v1)).normalize().mult(canvas_height * circle_scale / 2 + line_length / 2)
      const p1 = { x: circle_center.x - v2.x, y: circle_center.y - v2.y }
      const v3 = v2.normalize().mult(line_length);
      const p2 = { x: p1.x + v3.x, y: p1.y + v3.y }
      p.line(p1.x, p1.y, p2.x, p2.y)
      p.strokeWeight(1)
      p.textSize(15)
      p.textAlign(p.CENTER, p.BOTTOM)
      p.text((~~(progress_value / 77)) + i - dot_amount / 2, p1.x, p1.y)

      // p.line(circle_center.x, circle_center.y, circle_center.x - v2.x, circle_center.y - v2.y)
    }
    p.stroke(255, 200);
    p.strokeWeight(1);
    p.line(canvas_width / 2, 0, canvas_width / 2, canvas_height);
  }

  p.setup = () => {
    p.colorMode(p.HSB);
    switch_img(0);
    p.frameRate(40);
    main_canvas = p.createCanvas(canvas_width, canvas_height, "p2d");
    main_canvas.parent("p5-container");
  };

  p.draw = () => {
    progress_value++;
    p.background(0);
    const income_img_id = get_img_num();
    // console.log(income_img_id, current_img_id);
    if (income_img_id !== current_img_id) {
      console.log(progress_value, income_img_id);
      switch_img(income_img_id);
    } else {
      console.log(progress_value);
    }

    draw_graph(get_video_progress());
    current_img_id = income_img_id;
  };
};

new p5(sketch);
