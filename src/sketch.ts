const [IMG_AMOUNT, BACKEND_PORT, LOCALHOST] = [668, 3002, '10.254.24.189'];

// Get Div's width & height
const container_dom = <HTMLDivElement>document.getElementById("p5-container");
const canvas_width: number = container_dom.offsetWidth;
const canvas_height: number = container_dom.offsetHeight;

const frame_rate = 10;
const offset_x: number = 79;

// Constain variable for graphic generation
const [circle_scale, dot_amount] = [1.8, 8];
const circle_center_xy = [canvas_width / 2, canvas_height * circle_scale * 0.5 + (canvas_height * .4)]
const unit_length = 60;

// Declare Main Canvas
let main_canvas;
let rewinding: boolean = false;

let [progress_value, current_img_id] = [0, 0];

// Get realtime video progress value
const get_video_progress = () => {
  fetch(`http://${LOCALHOST}:${BACKEND_PORT}/osc-info`).then((res) => {
    res.text().then((data) => {
      // console.log(data)
      progress_value = parseFloat(data);
      // progress_value += 0.00001;
    })
  }).catch(err => console.log(err))
};


// Get image to show by progress_value
const get_img_num = (): number => {
  // ~~ : Math.round()
  return Math.floor(progress_value);
};

// Switch DOM backgroundImage by img_id
const switch_img = (img_id: number): void => {
  const img_container = <HTMLDivElement>(
    document.getElementById("img-container")
  );
  fetch(`http://${LOCALHOST}:${BACKEND_PORT}/imginfo/${img_id}`).then((res) => {
    res.json().then((data) => {
      let content: string = '';
      // console.log(data);
      for (const [key, value] of Object.entries(data)) {
        content += `${key} -> ${value}<br>`
      }
      document.getElementById('img-info')?.innerHTML = content
    });
  });
  if (img_container) img_container.style.backgroundImage = `url('http://${LOCALHOST}:${BACKEND_PORT}/img/${img_id}')`;
};


let current_touch_x: number | null;
const touch_step = 0.5;

container_dom.ontouchmove = e => {
  if (!rewinding) {
    const touch_x = e.touches[0].clientX;
    if (!current_touch_x) current_touch_x = touch_x;
    progress_value -= ((touch_x - current_touch_x) * touch_step)
    current_touch_x = touch_x;
    if (touch_x < current_touch_x) progress_value += touch_step;
    else progress_value -= touch_step;
  }
}

container_dom.ontouchend = () => {
  current_touch_x = null;
}


function send_osc() {
  fetch(`http://${LOCALHOST}:${BACKEND_PORT}/send/${progress_value / IMG_AMOUNT}`).then(res => { console.log(res) })
}


// P5 Script
const sketch = function(p: p5) {
  function draw_graph() {
    const circle_center = p.createVector(...circle_center_xy);
    p.noFill();
    p.stroke(90, 255, 70, 250);
    p.circle(circle_center.x, circle_center.y, canvas_height * circle_scale)
    p.strokeWeight(5);


    for (let i = -10; i < dot_amount + 10; i++) {
      const line_length = unit_length;
      const v1 = p.createVector(
        // canvas_width * i / dot_amount - ((progress_value * 190000) % canvas_width),
        // canvas_width * i / dot_amount - (((canvas_width / (dot_amount)) * (p.frameCount % frame_rate)) / frame_rate),
        // canvas_width * i / dot_amount - (offset_x * (p.frameCount % frame_rate) / frame_rate),
        canvas_width * i / dot_amount + offset_x * (1 - (progress_value - get_img_num())),
        canvas_height * .35
      );
      const v2 = (circle_center.copy().sub(v1)).normalize().mult(canvas_height * circle_scale / 2 + line_length / 2)
      const p1 = { x: circle_center.x - v2.x, y: circle_center.y - v2.y }
      const v3 = v2.normalize().mult(line_length);
      const p2 = { x: p1.x + v3.x, y: p1.y + v3.y }
      p.line(p1.x, p1.y, p2.x, p2.y)
      p.strokeWeight(1)
      p.textSize(15)
      p.textSize(20)
      p.textAlign(p.CENTER, p.BOTTOM)
      p.text(get_img_num() + i + 2 - dot_amount / 2, p1.x, p1.y)
    }
    p.stroke(255, 200);
    p.strokeWeight(1);
    p.line(canvas_width / 2, 0, canvas_width / 2, canvas_height);
  }

  p.setup = () => {
    p.colorMode(p.HSB);
    switch_img(0);
    p.frameRate(frame_rate);
    main_canvas = p.createCanvas(canvas_width, canvas_height, "p2d");
    main_canvas.parent("p5-container");
  };

  p.draw = () => {
    const sliding = current_touch_x != null;
    if (!sliding && !rewinding) {
      get_video_progress();
    }

    if (sliding) {
      send_osc();
    }

    if (progress_value >= IMG_AMOUNT - 2) rewinding = true;

    if (rewinding) {
      progress_value -= IMG_AMOUNT / (frame_rate * 3)
      send_osc()
    };

    if (progress_value <= 1 && rewinding) {
      progress_value = 0;
      current_touch_x = null;
      rewinding = false;
      send_osc()
    }

    p.background(0);
    const income_img_id = get_img_num();
    // console.log(income_img_id, current_img_id);
    if (income_img_id !== current_img_id) {
      console.log(progress_value, income_img_id);
      switch_img(income_img_id);
    }
    draw_graph();
    current_img_id = income_img_id;
  };
};

new p5(sketch);
