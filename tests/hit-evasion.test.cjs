const test = require('node:test');
const { setup } = require('./preparation-effects.test.cjs');

for (const [hit,eva,success,extra,expected] of [
    [1,.7,100,0,.3], [.85,.1,100,0,.75], [1,.2,80,0,.6],
    [1,.2,80,20,.8], [1.4,.7,100,0,.7], [0,0,100,0,0]
]) {
    test(`RIT physical hit=${hit} eva=${eva} success=${success} extra=${extra}`, () => {
        setup({speed:false,critical:false}).run(`
            $dataClasses[1].traits=[{code:22,dataId:0,value:${hit}}];
            $dataEnemies[1].traits=[{code:22,dataId:1,value:${eva}}];
            skill(900,{successRate:${success},note:'<additionalSuccessRate:${extra}>'});
            const x=action(); near(x.itemHit(b)*(1-x.itemEva(b)),${expected});
        `);
    });
}
test('RIT magical uses MEV, not attacker HIT; certain uses success only', () => {
    setup({speed:false,critical:false}).run(`
        $dataClasses[1].traits=[];
        $dataEnemies[1].traits=[{code:22,dataId:4,value:.3},{code:22,dataId:1,value:.7}];
        skill(900,{hitType:2,successRate:90,note:'<additionalSuccessRate:10>'});
        let x=action(); near(x.itemHit(b)*(1-x.itemEva(b)),.7);
        skill(901,{hitType:0,successRate:80}); x=action(901); near(x.itemHit(b),.8); near(x.itemEva(b),0);
    `);
});

// Battlers without a HIT trait on actor/class/enemy data use success rate as the
// baseline; equipment/state HIT is then a pure additive correction.
test('RIT physical without base HIT trait: success - eva, states add directly', () => {
    setup({speed:false,critical:false}).run(`
        $dataClasses[1].traits=[];
        $dataEnemies[1].traits=[{code:22,dataId:1,value:.1}];
        skill(900,{successRate:85});
        let x=action(); near(x.hitCorrection(),0); near(x.itemHit(b)*(1-x.itemEva(b)),.75);
        state(950,''); $dataStates[950].traits=[{code:22,dataId:0,value:0}]; a.addState(950);
        x=action(); near(x.hitCorrection(),0); near(x.itemHit(b)*(1-x.itemEva(b)),.75);
        state(951,''); $dataStates[951].traits=[{code:22,dataId:0,value:.2}]; a.addState(951);
        x=action(); near(x.hitCorrection(),.2); near(x.itemHit(b)*(1-x.itemEva(b)),.95);
    `);
});

test('RIT physical with base HIT trait: correction is total HIT - 100%, states still add', () => {
    setup({speed:false,critical:false}).run(`
        $dataClasses[1].traits=[{code:22,dataId:0,value:.95}];
        $dataEnemies[1].traits=[{code:22,dataId:1,value:.1}];
        skill(900,{successRate:85});
        let x=action(); near(x.hitCorrection(),-.05); near(x.itemHit(b)*(1-x.itemEva(b)),.7);
        state(951,''); $dataStates[951].traits=[{code:22,dataId:0,value:.2}]; a.addState(951);
        x=action(); near(x.hitCorrection(),.15); near(x.itemHit(b)*(1-x.itemEva(b)),.9);
        $dataClasses[1].traits=[]; $dataActors[1].traits=[{code:22,dataId:0,value:1}];
        x=action(); near(x.hitCorrection(),.2);
    `);
});

test('RIT enemy subject without traits hits with the skill success rate (goblin jab case)', () => {
    setup({speed:false,critical:false}).run(`
        $dataClasses[1].traits=[];
        skill(900,{successRate:85});
        const x=action(900,b); near(x.hitCorrection(),0); near(x.itemHit(a)*(1-x.itemEva(a)),.85);
        $dataEnemies[1].traits=[{code:22,dataId:0,value:.95}];
        near(x.hitCorrection(),-.05); near(x.itemHit(a)*(1-x.itemEva(a)),.8);
    `);
});

test('RIT_HitRateDisplay shows the same rate the judgement uses', () => {
    const { run } = setup({speed:false,critical:false});
    run('globalThis.window = globalThis;');
    run(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/plugins/Battle/Log/RIT_HitRateDisplay.js'), 'utf8'));
    run(`
        const actual = x => Math.round(Math.min(1,Math.max(0,x.itemHit(b)))*(1-Math.min(1,Math.max(0,x.itemEva(b))))*100);
        // base HIT 100%, EVA 70%: old display claimed 100%, judgement is 30%
        $dataEnemies[1].traits=[{code:22,dataId:1,value:.7}];
        skill(900,{successRate:100});
        let x=action(), info=x.getHitRateInfo(b);
        assert.equal(info.finalRate,30); assert.equal(info.finalRate,actual(x));
        assert.equal(x.subject().hit,1); assert.equal(info.hit,0);
        assert.equal(BattleManager._logWindow.makeHitRateDetailText(info),'[成功100%+命中補正+0%-回避70%]');
        // no base HIT, jab 85 vs EVA 10
        $dataClasses[1].traits=[]; $dataEnemies[1].traits=[{code:22,dataId:1,value:.1}];
        skill(900,{successRate:85}); x=action(); info=x.getHitRateInfo(b);
        assert.equal(info.finalRate,75); assert.equal(info.finalRate,actual(x));
        // negative correction and additional success rate
        $dataClasses[1].traits=[{code:22,dataId:0,value:.85}];
        skill(900,{successRate:80,note:'<additionalSuccessRate:20>'}); x=action(); info=x.getHitRateInfo(b);
        assert.equal(info.finalRate,75); assert.equal(info.finalRate,actual(x));
        assert.equal(BattleManager._logWindow.makeHitRateDetailText(info),'[成功100%+命中補正-15%-回避10%]');
        // magical and certain
        $dataEnemies[1].traits=[{code:22,dataId:4,value:.3}];
        skill(900,{hitType:2,successRate:90}); x=action(); info=x.getHitRateInfo(b);
        assert.equal(info.finalRate,60); assert.equal(info.finalRate,actual(x));
        skill(900,{hitType:0,successRate:80}); x=action(); info=x.getHitRateInfo(b);
        assert.equal(info.finalRate,80); assert.equal(info.finalRate,actual(x));
        assert.equal(info.displayRate,80);
    `);
});