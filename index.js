// 导入模块：从Three.js库中导入必要的模块
import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";
import { TextGeometry } from "three/addons/geometries/TextGeometry.js";
import { FontLoader } from "three/addons/loaders/FontLoader.js";

// 设置基本参数：获取浏览器窗口的宽度和高度用于设置画布大小
const width = window.innerWidth;
const height = window.innerHeight;

// 定义游戏对象：食物对象：定义食物的位置x和z，以及食物的几何体foodsphere和类型foodType。
var food = { x: null, z: null, foodsphere: null, foodType: null };

// 定义游戏状态：定义游戏是否可以移动（step）
let step = true;

// 定于分数
let score = 0;

// 定义摄像机状态
let cameraState = 1;

// 游戏结束状态
let gameOver = false;

// 另一种游戏结束状态，State of heating itself
let heatGameOver = false;

// 创建渲染器：初始化WebGLRenderer并设置其大小为浏览器窗口大小，启用抗锯齿和阴影映射。
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(width, height);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// 创建场景：创建一个新的Scene对象。
export const scene = new THREE.Scene();

// 加载字体并添加文字
const loader = new FontLoader();

loader.load("./assets/fonts/Xiangjiao-xiaoxingyunilinggan_Regular.json", function (font) {
    const scoreGeo = new TextGeometry(`成绩 : `, {
        font: font,
        size: 8,
        height: 1.5,
    });
    var textMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    var text = new THREE.Mesh(scoreGeo, textMaterial);
    text.position.set(-25, 0, -35);
    scene.add(text);

    const nameGeo = new TextGeometry("小蔡的贪吃蛇", {
        font: font,
        size: 8,
        height: 1.5,
    });
    let nameMaterial = new THREE.MeshStandardMaterial({ color: 0x0FBEE5 });
    let name = new THREE.Mesh(nameGeo, nameMaterial);
    name.position.set(-35, 0, 28);
    name.rotateY((90 * Math.PI) / 180);
    name.rotateX((-5 * Math.PI) / 180);
    scene.add(name);
});


// 创建透视相机：初始化一个透视相机，并设置其位置。
const camera = new THREE.PerspectiveCamera(50, width / height, 0.01, 1000);
camera.position.set(10, 50, 45);

// 创建轨道控制器：使用OrbitControls创建一个控制器来控制相机的视角。
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.03;

// 创建地面：创建一个长方体作为地面，并设置其颜色和位置，并添加到场景中。
const groundMesh = new THREE.Mesh(new THREE.BoxGeometry(54, 1, 54), new THREE.MeshStandardMaterial({ color: 0xC38E40 }));
groundMesh.receiveShadow = true;
groundMesh.position.y = -1.5;
scene.add(groundMesh);

// 添加光源：创建一个点光源，并添加到场景中。
const light = new THREE.PointLight(0xffffff, 1.5, 1000, 0);
light.position.set(0, 50, 0);
light.castShadow = true;
scene.add(light);

// 添加光源：创建一个半球光源，并添加到场景中。
const light2 = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
scene.add(light2);


// 定义球体类：继承自THREE.Mesh，创建一个表示球体的类。
class Sphere extends THREE.Mesh {
    constructor({ x, y, z }, radius, color = "#00ff00") {
        super(new THREE.SphereGeometry(radius, 32, 32), new THREE.MeshStandardMaterial({ color }));
        this.radius = radius;

        this.x = x;
        this.y = y;
        this.z = z;

        this.position.set(x, y, z);

        this.top = this.position.y + this.radius;
        this.bottom = this.position.y - this.radius;
        this.right = this.position.x + this.radius;
        this.left = this.position.x - this.radius;
        this.front = this.position.z + this.radius;
        this.back = this.position.z - this.radius;
    }
}

// 创建金币类：继承自THREE.Mesh，创建一个表示金币的类。
class Coin extends THREE.Mesh {
    constructor({ x, y, z }, radius, height, color = "#FFD700") {
        super(new THREE.CylinderGeometry(radius, radius, height, 32), new THREE.MeshStandardMaterial({ color, metalness: 0.8, roughness: 0.2 }));
        this.position.set(x, y, z);
        this.rotation.x = Math.PI / 2; // 使金币竖起来
        this.castShadow = true;
    }
}

// 定义蛇类：创建一个表示蛇的类，包含蛇的身体部分、方向和运动方法。
class Snake {
    constructor() {
        this.parts = [new Sphere({ x: 0, y: 0, z: 0 }, 1, 0xffffff), new Sphere({ x: 2, y: 0, z: 0 }, 1, 0xffffff), new Sphere({ x: 4, y: 0, z: 0 }, 1, 0xffffff)];
        this.up = true;
        this.down = false;
        this.right = false;
        this.left = false;

        this.unit = 2;
        this.velocity = 1;
        this.gravity = 0.5;
    }

    // 移动方法：根据当前的方向移动蛇，并处理边界条件。
    move(state) {
        if (!state) {
            scene.remove(this.parts[0]);
            this.parts.shift();
        }
        if (!gameOver) {
            this.head = this.parts[this.parts.length - 1];
            let headColor =  0xff0000; 
            let bodyColor = 0x00ff00; 
            if (this.up) {
                if (this.head.position.z - this.unit < -27) gameOver = true;
                var sphere = new Sphere({ x: this.head.x, y: this.head.y, z: this.head.z - this.unit }, 1 , headColor);
            }
            if (this.down) {
                if (this.head.position.z + this.unit > 27) gameOver = true;
                var sphere = new Sphere({ x: this.head.x, y: this.head.y, z: this.head.z + this.unit }, 1 , headColor);
            }
            if (this.right) {
                if (this.head.position.x + this.unit > 27) gameOver = true;
                var sphere = new Sphere({ x: this.head.x + this.unit, y: this.head.y, z: this.head.z }, 1 , headColor);
            }
            if (this.left) {
                if (this.head.position.x - this.unit < -27) gameOver = true;
                var sphere = new Sphere({ x: this.head.x - this.unit, y: this.head.y, z: this.head.z }, 1 , headColor);
            }
            this.parts.push(sphere);
            this.parts.forEach((part, index) => {
                part.castShadow = true;
                if (index < this.parts.length - 1) {
                    part.material.color.set(bodyColor); // 设置身体部分为绿色
                }
                scene.add(part);
            });
            scene.add(sphere);
        }
    }

    // 下落方法：模拟蛇的下落效果
    fall() {
        this.head = this.parts[this.parts.length - 1];
        if (this.parts[0].position.y < -200) {
            this.parts.forEach((part) => {
                scene.remove(part);
            });
            return;
        }
        this.velocity += this.gravity;
        scene.remove(this.parts[0]);
        this.parts.shift();
        var sphere = new Sphere({ x: this.head.x, y: this.head.y - this.velocity, z: this.head.z }, 1);

        this.parts.push(sphere);
        this.parts.forEach((part) => {
            part.castShadow = true;
            scene.add(part);
        });

        scene.add(sphere);
    }
}

const snake = new Snake();


// 创建星星：在场景中随机生成2000个星星。
function createStars() {
    for (let i = 0; i < 2000; i++) {
        let x = Math.floor((Math.random() + 0.1) * (Math.random() + 0.2) * 500);
        if (Math.random() > 0.5) {
            x *= -1;
        }
        let y = Math.floor((Math.random() + 0.1) * (Math.random() + 0.2) * 500);
        if (Math.random() > 0.5) {
            y *= -1;
        }
        let z = Math.floor((Math.random() + 0.1) * (Math.random() + 0.2) * 500);
        if (Math.random() > 0.5) {
            z *= -1;
        }
        if (x > 1000 || y > 1000 || z > 1000) {
            return;
        }
        let starMesh = new THREE.Mesh(
            new THREE.SphereGeometry(Math.floor(Math.random() * 2), 32, 32),
            new THREE.MeshStandardMaterial({
                color: `hsl(${Math.random() * 360}, 100%, 50%)`,
            })
        );
        starMesh.position.set(x, y, z);
        scene.add(starMesh);
    }
}
createStars();


// 创建食物：在随机位置生成食物，并确保食物不在蛇的身体上。
function createFood() {
    let xIndex = Math.floor((Math.random() - 0.5) * 25) * 2;
    let zIndex = Math.floor((Math.random() - 0.5) * 25) * 2;

    for (let i = 0; i < snake.parts.length; i++) {
        if (snake.parts[i].position.x == xIndex && snake.parts[i].position.z == zIndex) {
            createFood();
            return false;
        }
    }
    if (Math.random() > 0.1 || cameraState != 1) {
        var foodsphere = new Sphere({ x: xIndex, y: 0, z: zIndex }, 1, 0xff0000);
        scene.add(foodsphere);
        food.x = xIndex;
        food.z = zIndex;
        food.foodsphere = foodsphere;
        food.castShadow = true;
        food.foodType = 1;
    } else {
        var foodsphere = new Sphere({ x: xIndex, y: 0, z: zIndex }, 1, 0x0000ff);
        scene.add(foodsphere);
        food.x = xIndex;
        food.z = zIndex;
        food.foodsphere = foodsphere;
        food.castShadow = true;
        food.foodType = 2;
    }
}


createFood();
let text;


// 计分函数：加载字体并显示当前得分。
function scoreFunc() {
    let loader = new FontLoader();
    loader.load("./assets/fonts/Xiangjiao-xiaoxingyunilinggan_Regular.json", (font) => {
        const geometry = new TextGeometry(`${score}`, {
            font: font,
            size: 8,
            height: 1.5,
        });
        let textMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
        let textMesh = new THREE.Mesh(geometry, textMaterial);
        textMesh.position.set(11, 0, -35);
        scene.add(textMesh);
        text = textMesh;
    });
}
scoreFunc();


// 检查游戏结束：检查蛇头是否与身体其他部分相撞
function checkEndGame() {
    let head = snake.parts[snake.parts.length - 1];
    snake.parts.forEach((part) => {
        if (head.position.x == part.position.x && head.position.z == part.position.z && part != head) {
            heatGameOver = true;
            return;
        }
    });
}

// 旋转相机
function rotateCamera() {
    camera.position.x = Math.sin(Date.now() * 0.001) * 10;
    camera.rotateZ(0.001);
    camera.rotateX(0.001);
    camera.position.z = Math.cos(Date.now() * 0.001) * 10;
}


// 改变相机角度
function changeCameraAngle(state) {
    var xStep = 20 / 100;
    var yStep = 100 / 100;
    var zStep = 90 / 100;
    let counter = 0;
    let change = setInterval(() => {
        if (state == "goBack") {
            camera.position.x += xStep;
            camera.position.y += yStep;
            camera.position.z += zStep;
        } else if (state == "goForward") {
            camera.position.x -= xStep;
            camera.position.y -= yStep;
            camera.position.z -= zStep;
        }
        if (counter == 500) {
            clearInterval(change);
        }
        counter += 5;
    }, 5);
}

// 处理键盘事件：监听键盘输入并改变蛇的运动方向。
addEventListener("keydown", (event) => {
  
    if ((event.key == "w" || event.key == "W" || event.key == "8" || event.key == 'ArrowUp') && !snake.down && step) {
        snake.right = false;
        snake.left = false;
        snake.up = true;
        step = false;
    } else if ((event.key == "s" || event.key == "S"|| event.key == "2" || event.key == 'ArrowDown')  && !snake.up && step) {
        snake.right = false;
        snake.left = false;
        snake.down = true;
        step = false;
    }
    if ((event.key == "a" || event.key == "A" || event.key == "4" || event.key == 'ArrowLeft') && !snake.right && step) {
        snake.up = false;
        snake.down = false;
        snake.left = true;
        step = false;
    }
    if ((event.key == "d" || event.key == "D" || event.key == "6" || event.key == 'ArrowRight') && !snake.left && step) {
        snake.up = false;
        snake.down = false;
        snake.right = true;
        step = false;
    }
    if (event.code == "Space") {
        isPaused = !isPaused;
        
    }
});

// counter变量在代码中主要用于控制游戏的节奏。它在每一帧都会递增，当counter变量的值为[speed]的倍数时，会触发一些特定的操作，例如蛇的移动、食物的生成或得分的更新。
let counter = 0;
let speed = 8;
let foodEatenCountInState2 = 0;

let isPaused = false;

// 动画循环：每帧更新场景并渲染。
// 处理蛇的移动：根据蛇的方向更新相机位置，并处理蛇的移动和碰撞检测。
// 处理得分：如果蛇吃到食物，则增加得分并更新文本显示。
// 处理游戏结束：如果蛇撞到自身或墙壁，则游戏结束，并处理摄像机角度的变化。
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
    if(!isPaused){
        if (!gameOver && !heatGameOver) {
            // 根据蛇的方向调整相机位置
            if (snake.up) {
                camera.position.z -= 1 / 10;
            } else if (snake.down) {
                camera.position.z += 1 / 10;
            } else if (snake.right) {
                camera.position.x += 1 / 10;
            } else {
                camera.position.x -= 1 / 10;
            }
        } else if (gameOver) {
            if (counter % speed == 0 && snake.parts.length > 0) {
                snake.fall();
            } else {
                if (cameraState == 1) {
                    // changeCameraAngle("goBack");
                    // cameraState = 2;
                }
                rotateCamera();
            }
        }
    }
    if (counter % speed == 0 && !gameOver && !heatGameOver && !isPaused) {
        step = true;
        let head = snake.parts[snake.parts.length - 1];

        if (head.position.x == food.x && head.position.z == food.z) {
            // 吃到食物后的处理
            if (food.foodType == 1) {
                score += 10;
                if (cameraState == 2) {
                    foodEatenCountInState2++;
                    score += 40;
                }
                if (foodEatenCountInState2 == speed) {
                    changeCameraAngle("goForward");
                    cameraState = 1;
                    foodEatenCountInState2 = 0;
                }
            } else if (food.foodType == 2) {
                cameraState = 2;
                changeCameraAngle("goBack");
                score += 100;
            }
            scene.remove(text);
            text = scoreFunc();
            scene.remove(food.foodsphere);
            createFood();
            snake.move(true);
            checkEndGame();
        } else {
            snake.move(false);
            checkEndGame();
        }
    }
    counter++;
}
animate();
