import BLOCK from "./block.js";

//DOM
const playground = document.querySelector('.playground > ul');
const gameText = document.querySelector('.game-text');
const scoreDisplay = document.querySelector('.score');
const restartButton = document.querySelector('.game-text button');

//setting
const GAME_ROWS = 20;
const GAME_COLS = 10;

//변수
let score = 0;
let duration = 500; //block 떨어지는 시간
let downInterval; 
let tempMovingItem; //moivng 실행 전 담아주는 용도


/* //3.블럭 만들기. 만들어진 블럭에 movingItem의 left, top값을 더해 움직여줄 것임.
const BLOCK = {
    tree: [
        [[2,1], [0,1], [1,0], [1,1]], //방향키 돌렸을 때 좌표에 따라 모양 변경
        [[1,2], [0,1], [1,0], [1,1]],
        [[1,2], [0,1], [2,1], [1,1]],
        [[2,1], [1,2], [1,0], [1,1]],
    ], //새모양 추가. 그런데 데이터가 많아지니 따로 block.js로 옮기기.

}; */

//3.실질적으로 다음 블럭의 타입과 좌표 정보
const movingItem = {
    type: '',
    direction: 3, //방향키 눌렀을 때 회전하는 기준
    top: 0, //어디까지 내려가는지
    left: 0, //초기값을 가운데부터 시작
}

init();

//2. init() 안에 정리. 처음 화면이 시작되고 스크립트 호출될 때 바로 시작되는 함수
function init(){
    //10. 랜덤한 모양 나타나게
    //console.log(Object.entries(BLOCK).length); //BLOCK은 객체여서 그냥 length 쓰면 길이가 안 나옴. so Object.entries로 블럭 감싼 뒤 사용.
    /* const blockArray = Object.entries(BLOCK);
    const randomIndex = Math.floor(Math.random() * blockArray.length);
    blockArray[randomIndex][0] 
    
    blockArray.forEach(block => {
        console.log(block[0]);
    }) */
    
    // tempMovingItem 값을 주기적으로 바꾸는데 바꾼 값이 안 맞게 되면 다시 원복시켜야 한다.
    // so movingItem을 일단 내버려두고 temMoving로 먼저 시도해보고 바꾸려고 하는 것.
    tempMovingItem = { ...movingItem }; //펼침연산자 : 그냥 tempMovingItem = movingItem 해버리면 둘이 연동되어 값이 변하면 똑같이 변형됨. so 정보만 가져오고자 함.
    for(let i = 0; i < GAME_ROWS; i++) {
        //console.log(i);
        prependNewLine()
    }
    generateNewBlock()
}

//1. 빈 playground>ul 안에 동적으로 요소 집어넣기
function prependNewLine(){
    //ul 안에 li 20개 집어넣기
    const li = document.createElement('li');
    const ul = document.createElement('ul');
    //ul 안에 제일 작은 li를 다시 만들기 위해 반복문 추가
    for(let j = 0; j < GAME_COLS; j++) {
        const matrix = document.createElement('li');
        ul.prepend(matrix); //ul 안에 matrix(제일 작은 네모) 집어넣기
    }
    li.prepend(ul) //li 안에 ul 집어넣기
    playground.prepend(li) //최종 ul 안에 li 집어넣기.
}

//3.블럭 렌더링 함수. 블럭 선택 후 BLOCKS 값에 맞게 그림 그려줌.
function renderBlock(moveType = '') {
    const { type, direction, top, left } = tempMovingItem; //구조분해할당? tempMovingItem의 값 가져와 개별적으로 담기.

    //6. moving 클래스만 있는 블럭만 움직이게. 나머지는 제거
    const movingBlock = document.querySelectorAll('.moving'); //moving 클래스 가진 모든 것 가져오기.
    movingBlock.forEach(moving => {
        moving.classList.remove(type, 'moving'); //moving 가진 애들은 moving 빼주기.
    })
    //console.log(type, direction, top, left);
    //렌더링 //temMoving 안에 들은 property들을 변수 사용해서
    //block안의 type,direction에 접근. 이를 forEach로 반복문 돌려 각각의 클래스에 위치.
    BLOCK[type][direction].some(block => { //forEach는 중간에 break 할 수 없으므로 some으로 교체.
        const x = block[0] + left;  //블럭 초기 위치에서 left, top 만큼 움직이기.
        const y = block[1] + top; 
        //5. const target = playground.childNodes[y].childNodes[0].childNodes[x];
        //7. 범위 밖으로 벗어나지 못하게
        //ul > li의 y번째 안에 들어있는 0번째 ul의 x번째 li
        const target = playground.childNodes[y] ? playground.childNodes[y].childNodes[0].childNodes[x] : null;
        const isAvailable = checkEmpty(target); //checkEmpty()로 타겟 넘겨줌. 1) 빈 여백을 체크해 밖으로 삐져나가는지 체크 2) 블럭이 쌓일 때 하단에 블럭이 있는지 없는지 체크.
        if(isAvailable){
            target.classList.add(type, 'moving');
        } else {
            tempMovingItem = { ...movingItem }; //tempmoving 값을 원래대로 돌리기.
            if(moveType === 'retry') {
                clearInterval(downInterval);
                showGameoverText(); //14. 게임오버
            }
            setTimeout(() => {
                renderBlock('retry'); //seizeBlock 전에 renderBlock 먼저 실행.
                if(moveType === 'top') {
                    seizeBlock(); //movetype이 top을 누르면 블럭을 고정시키기.
                }
                //renderBlock(); //재귀함수. 빈공간이 있으면 좌표를 다시 원상태로 옮겨놓고 다시 한 번 얘를 부르는 것. 주의! 쿨스택 멕시멈 에러. 이를 방지하기 위해 setTimeout에 넣어노을 거임. 이벤트루프에 예약된 이벤트들이 다 실행되면 루프!
            }, 0)
            return true;
        }
        //console.log(target);
        //target.classList.add(type, 'moving') //가장 작은 li에 type을 클래스로 주기. css에서 type별 색 주면 모양별로 색 다르게 적용.
    })
    movingItem.left = left;
    movingItem.top = top;
    movingItem.direction = direction;
}

//8. seizeBlock - 블럭 고정. 
function seizeBlock(){
    //seized 클래스를 줘서 
    //console.log('seize block')

    //movingBlock 가져와 seized로 클래스 바꾸기
    const movingBlock = document.querySelectorAll('.moving'); //moving 클래스 가진 모든 것 가져오기.
    movingBlock.forEach(moving => {
        moving.classList.remove('moving'); //moving 가진 애들은 moving 빼주기.
        moving.classList.add('seized');
    });
    //13. 블럭 안착됐을 때 바닥 깨지기
    checkMatch();

    //9. seizeblock 실행되면 새 블럭 만들어 실행.
    //generateNewBlock()
}

function checkMatch(){

    const childNodes = playground.childNodes;
    childNodes.forEach(child => {
        let matched = true;
        child.children[0].childNodes.forEach(li => {
            if(!li.classList.contains('seized')){
                matched = false;
            }
        });
        if(matched){
            child.remove();
            prependNewLine();
            score++;
            scoreDisplay.innerText = score;
        }
    });
    generateNewBlock();
}

//9. 새 블럭 만들어 실행.
function generateNewBlock(){
    //11. 자동으로 일정시간동안 블럭 1씩 내려오게
    clearInterval(downInterval);
    downInterval = setInterval(() => {
        moveBlock('top', 1)
    }, duration)//500 시간 마다

    //10. 블럭 타입 변경. 랜덤한 모양 나타나게. init()에서 먼저 시도한 걸 여기로 가져옴.
    //console.log(Object.entries(BLOCK).length); //BLOCK은 객체여서 그냥 length 쓰면 길이가 안 나옴. so Object.entries로 블럭 감싼 뒤 사용.
    const blockArray = Object.entries(BLOCK);
    const randomIndex = Math.floor(Math.random() * blockArray.length);
    
    //type은 고정시키고 숫자만 바꿔서 만들기.
    movingItem.type = blockArray[randomIndex][0];
    movingItem.top = 0;
    movingItem.left = 3;
    movingItem.direction = 0;
    tempMovingItem = {...movingItem};
    renderBlock();
}


//7. 타겟값을 넘겨받아 확인
//seized 클래스를 가지고 있으면 빈값이 아니라는 의미. so isAvailable로 넘어감.
function checkEmpty(target){
    if(!target || target.classList.contains('seized')){ 
        return false;
    }
    return true;
}

//6. 실제로 keydown 이벤트에 따라 블럭 움직여줌.
function moveBlock(moveType, amount){
    tempMovingItem[moveType] += amount;  //moveType은 tempmoving 통해서 렌더링하기 때문에 tempmoving 값을 바꿔줌.
    renderBlock(moveType); //여기까지 했을 때 이동은 되지만 기존 class가 안 없어져서 그대로 색이 남아있음. so renderBlock 함수 안에 moving 클래스를 추가해서 해당 클래스를 가지면 색 없어지도록 할거임.
}

//8. 블럭 위치 바꾸기.
function changeDirection(){
    const direction = tempMovingItem.direction;
    direction === 3 ? tempMovingItem.direction = 0 : tempMovingItem.direction += 1;
    renderBlock();
}

//12. space 눌렀을 때 한 번에 내려오기
function dropBlock(){
    clearInterval(downInterval);
    downInterval = setInterval(() => {
        moveBlock('top',1);
    }, 20)
}

//14. 게임오버 텍스트
function showGameoverText(){
    gameText.style.display = 'flex';
}

//5.방향키 따라 블럭 조정해줄 것.
//key 눌렀을 때 이벤트. 각 키는 keycode를 갖는데 이벤트 실행하면 keycode 정보도 보여줌. 
document.addEventListener('keydown', e => {
    //console.log(e);
    //ket를 사용해도 되지만 keyCode를 사용할 것
    switch(e.keyCode) {
        case 39: //39는 오른쪽 키코드. 해당 키코드 일 때 위치 변경.
            moveBlock('left', 1);
            break;
        case 37: //37은 왼쪽 키코드.
            moveBlock('left', -1);
            break;
        case 40: //40은 하단.
            moveBlock('top', 1);
            break;
        case 38: //8. seize() 전에 모양 바꾸기.
            changeDirection();
            break;
        case 32: //32는 space
            dropBlock();
            break;
        default:
            break;
    }
})

restartButton.addEventListener('click', () => {
    playground.innerHTML = '';
    gameText.style.display = 'none';
    score = 0;
    scoreDisplay.innerText = 0;
    init();
})