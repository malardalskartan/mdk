var styleSettings = {
	defaultStyle: [{
		title: undefined,
		minScale: undefined,
		maxScale: undefined,
		stroke: {
			color: 'rgba(0,0,0,1.0)',
			lineDash: undefined,
			width: 2
		},
		fill: {
			color: 'rgba(0,0,0,0.5)',
		},
		icon: {
			src: undefined,
			scale: undefined
		},
		circle: {
			stroke: 'rgba(0,0,0,1.0)',
			fill: 'rgba(0,0,0,0.5)',
			radius: 10
		}
	}], //end defaultStyle
	mask: [{
		stroke: {
			color: 'rgba(0,0,0,1.0)'
		},
		fill: {
			color: 'rgba(0,0,0,1.0)'
		}
	}],
	fornminnen_ytor: [{
		fill: {
			color: 'rgba(0,0,0,0.5)'
		}
	}],
	ledig_naringsmark: [{
		fill: {
			color: 'rgba(0,0,0,0.5)'
		},
		maxScale: 10000,
		filter: {
			attribute: 'TYP',
			operand: '==',
			value: 'Ledig Tomtmark'
		}	
	},{
		fill: {
			color: 'rgba(100,50,150,0.5)'
		},
		filter: {
			attribute: 'TYP',
			operand: '==',
			value: 'Option/Offert'
		}
	}],	
	fmis_punktval: [{
		icon: {
			src: 'data/svg/fornlamning.svg',
			scale: 0.025
		},
		filter: {
			attribute: 'lamningtyp',
			operand: '==',
			value: 'Byggnad annan'
		}		
	}]		

} //end styleSettings