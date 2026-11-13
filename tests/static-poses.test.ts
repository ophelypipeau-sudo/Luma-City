import test from 'node:test';
import assert from 'node:assert/strict';
import {readStaticPoses} from '../apps/web/src/avatar/static-poses';
import {LEFT_REST_ARM} from '../apps/web/src/avatar/HeartHandsDoll';
import {Resvg} from '@resvg/resvg-js';
test('pose preferences remain independent per character and ignore damaged or obsolete values',()=>{
 const iris=JSON.stringify(['account','iris']),june=JSON.stringify(['account','june']);
 const saved=JSON.stringify({[iris]:'heart-hands',[june]:'front',invalid:'breathe',bad:{top:'shirt'}});
 assert.deepEqual(readStaticPoses(saved),{[iris]:'heart-hands',[june]:'front'});
 assert.deepEqual(readStaticPoses('not json'),{});assert.deepEqual(readStaticPoses('[]'),{});
 assert.equal(readStaticPoses(JSON.stringify({...readStaticPoses(saved),[iris]:'hand-on-hip'}))[june],'front');
});
test('heart rest mask removes both old shoulder caps completely, including their upper edges',()=>{
 const svg='<svg xmlns="http://www.w3.org/2000/svg" width="887" height="1774"><defs><mask id="rest"><rect width="887" height="1774" fill="white"/><path d="'+LEFT_REST_ARM+'" fill="black"/><path d="'+LEFT_REST_ARM+'" fill="black" transform="translate(887 0) scale(-1 1)"/></mask></defs><rect width="887" height="1774" fill="white" mask="url(#rest)"/></svg>';
 const pixels=new Resvg(svg).render().pixels;
 for(const [x,y] of [[300,350],[300,380],[587,350],[587,380]])assert.equal(pixels[(y*887+x)*4+3],0);
 for(const [x,y] of [[443,180],[443,350],[443,620],[350,1000]])assert.equal(pixels[(y*887+x)*4+3],255);
});
